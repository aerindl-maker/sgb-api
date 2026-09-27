import { Op } from "sequelize"
import { Threshold } from "@/models/threshold.model.js"
import { PaginationSchema } from "@/schemas/pagination.schema.js"
import { type RequestHandler } from "express"
import { ThresholdCreateSchema, ThresholdQuerySchema, ThresholdUpdateSchema } from "@/schemas/threshold.schema.js"
import { WsEvent } from "@/schemas/ws.event.schema.js"
import espWebsocket from "@/websockets/esp.websocket.js"
import { DEFAULT_ESP_ID } from "@/schemas/esp.schema.js"
import espService from "@/services/esp.service.js"

//

const get: RequestHandler = async (req, res) => {
    const { data, error, success } = PaginationSchema.and(ThresholdQuerySchema).safeParse(req.query)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    const keys = Object.keys(PaginationSchema.shape)
    const entries = Object.entries(data).filter(([k, v]) => !keys.includes(k) && v != undefined)

    const { alpha, omega, limit, offset } = data
    const where: any = Object.fromEntries(entries)
    where.espId = data.espId ?? DEFAULT_ESP_ID
    const createdAt = { ...(alpha && { [Op.gte]: alpha }), ...(omega && { [Op.lte]: omega }) }
    if (Object.keys(createdAt).length) where.createdAt = createdAt
    if (!(await espService.owns(req.user, where.espId))) return res.status(404).send("Esp not found.")

    const thresholds = await Threshold.findAll({ where, raw: true, limit, offset })
    res.send(thresholds)
}

const post: RequestHandler = async (req, res) => {
    const { data, error, success } = ThresholdCreateSchema.safeParse(req.body)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    const esp = await espService.findOwned(req.user, req.body)
    if (!esp) return res.status(404).send("Esp not found.")

    const threshold = await Threshold.create({ ...data, espId: esp.id })
    res.send(threshold.dataValues)

    const event: WsEvent = { name: "Threshold", data: [threshold.dataValues], query: "Create" }
    await espWebsocket.sendTo(esp.id, event)
}

const patch: RequestHandler = async (req, res) => {
    const tid = req.params.tid as string
    if (!tid) return res.status(400).send("Threshold id required.")

    const { data, error, success } = ThresholdUpdateSchema.safeParse(req.body)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    const threshold = await Threshold.findByPk(tid)
    if (!threshold || !(await espService.owns(req.user, threshold.espId))) return res.status(404).send("Threshold not found.")

    await threshold.update(data)
    res.send(threshold.dataValues)

    const event: WsEvent = { name: "Threshold", data: [threshold.dataValues], query: "Update" }
    await espWebsocket.sendTo(threshold.espId ?? DEFAULT_ESP_ID, event)
}

const destroy: RequestHandler = async (req, res) => {
    const tid = req.params.tid as string
    if (!tid) return res.status(400).send("Threshold id required.")

    const threshold = await Threshold.findByPk(tid)
    if (!threshold || !(await espService.owns(req.user, threshold.espId))) return res.status(404).send("Threshold not found.")

    await threshold.destroy()

    return res.status(204).send("Threshold deleted successfully.")
}

//

export default { get, post, patch, destroy }
