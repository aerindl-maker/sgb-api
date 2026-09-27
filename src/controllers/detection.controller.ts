import { Op } from "sequelize"
import { Detection } from "@/models/detection.model.js"
import { PaginationSchema } from "@/schemas/pagination.schema.js"
import { type RequestHandler } from "express"
import { DetectionCreateSchema, DetectionQuerySchema, DetectionUpdateSchema } from "@/schemas/detection.schema.js"
import detectionOrchestrator from "@/orchestrators/detection.orchestrator.js"
import z from "zod"
import { Capture } from "@/models/capture.model.js"
import espService from "@/services/esp.service.js"
import { type UserSafeSchema } from "@/schemas/user.schema.js"

//

const ownsCapture = async (user: UserSafeSchema | undefined, captureId: number | string) => {
    const capture = await Capture.findByPk(captureId, { attributes: ["espId"] })
    return !!capture && await espService.owns(user, capture.espId)
}

//

const get: RequestHandler = async (req, res) => {
    const { data, error, success } = PaginationSchema.and(DetectionQuerySchema).safeParse(req.query)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    const keys = Object.keys(PaginationSchema.shape)
    const entries = Object.entries(data).filter(([k, v]) => !keys.includes(k) && v != undefined)

    const { alpha, omega, limit, offset } = data
    const where: any = Object.fromEntries(entries)
    const createdAt = { ...(alpha && { [Op.gte]: alpha }), ...(omega && { [Op.lte]: omega }) }
    if (Object.keys(createdAt).length) where.createdAt = createdAt

    // --- Detections belong to an esp through their capture
    const espIds = await espService.ownedIds(req.user)
    const include = espIds && [{ model: Capture, as: "capture", attributes: [], where: { espId: espIds } }]

    const detections = await Detection.findAll({ where, raw: true, limit, offset, ...(include && { include }) })
    res.send(detections)
}

const post: RequestHandler = async (req, res) => {
    const cid = req.params.cid as string
    if (!cid) return res.status(400).send("Capture id required.")

    const { data, error, success } = DetectionCreateSchema.safeParse(req.body)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    if (!(await ownsCapture(req.user, cid))) return res.status(404).send("Capture not found.")

    const detection = await Detection.create({ ...data, captureId: Number(cid) })
    res.send(detection.dataValues)
    await detectionOrchestrator.evaluate([detection.dataValues])
}

const patch: RequestHandler = async (req, res) => {
    const did = req.params.did as string
    if (!did) return res.status(400).send("Detection id required.")

    const { data, error, success } = DetectionUpdateSchema.safeParse(req.body)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    const detection = await Detection.findByPk(did)
    if (!detection || !(await ownsCapture(req.user, detection.captureId))) return res.status(404).send("Detection not found.")

    await detection.update(data)
    res.send(detection.dataValues)
}

const destroy: RequestHandler = async (req, res) => {
    const did = req.params.did as string
    if (!did) return res.status(400).send("Detection id required.")

    const detection = await Detection.findByPk(did)
    if (!detection || !(await ownsCapture(req.user, detection.captureId))) return res.status(404).send("Detection not found.")

    await detection.destroy()

    return res.status(204).send("Detection deleted successfully.")
}

//

const postBulk: RequestHandler = async (req, res) => {
    const cid = req.params.cid as string
    if (!cid) return res.status(400).send("Capture id required.")

    const { data, error, success } = z.array(DetectionCreateSchema).safeParse(req.body)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    if (!(await ownsCapture(req.user, cid))) return res.status(404).send("Capture not found.")

    const datas = data.map((d) => ({ ...d, captureId: Number(cid) }))
    const detections = await Detection.bulkCreate(datas)
    res.send(detections)
    await detectionOrchestrator.evaluate(detections)
}

//

export default { get, post, patch, destroy, postBulk }
