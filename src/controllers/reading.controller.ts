import { Reading } from "@/models/reading.model.js"
import thresholdOrchestrator from "@/orchestrators/threshold.orchestrator.js"
import { PaginationSchema } from "@/schemas/pagination.schema.js"
import { ReadingCreateSchema, ReadingQuerySchema, ReadingUpdateSchema } from "@/schemas/reading.schema.js"
import { type RequestHandler } from "express"
import { Op } from "sequelize"

//

const parseQuery = (query: unknown) => {
    const { data, error, success } = PaginationSchema.and(ReadingQuerySchema).safeParse(query)
    if (!success) return { error: error.issues.at(0)?.message }

    const keys = Object.keys(PaginationSchema.shape)
    const entries = Object.entries(data).filter(([k, v]) => !keys.includes(k) && v != undefined)

    const { alpha, omega, limit, offset, order = "asc" } = data
    const where: any = Object.fromEntries(entries)
    const createdAt = { ...(alpha && { [Op.gte]: alpha }), ...(omega && { [Op.lte]: omega }) }
    if (Object.keys(createdAt).length) where.createdAt = createdAt

    return { where, limit, offset, order }
}

const get: RequestHandler = async (req, res) => {
    const query = parseQuery(req.query)
    if ("error" in query) return res.status(400).send(query.error)

    const { where, limit, offset, order } = query

    // --- Stable ordering keeps offset pages from overlapping
    const readings = await Reading.findAll({
        where,
        raw: true,
        limit,
        offset,
        order: [["createdAt", order], ["id", order]],
    })
    res.send(readings)
}

const count: RequestHandler = async (req, res) => {
    const query = parseQuery(req.query)
    if ("error" in query) return res.status(400).send(query.error)

    const total = await Reading.count({ where: query.where })
    res.send({ count: total })
}

const post: RequestHandler = async (req, res) => {
    const { data, error, success } = ReadingCreateSchema.safeParse(req.body)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    const reading = await Reading.create(data)
    res.send(reading.dataValues)
    await thresholdOrchestrator.evaluate(reading.dataValues)
}

const patch: RequestHandler = async (req, res) => {
    const rid = req.params.rid as string
    if (!rid) return res.status(400).send("Reading id required.")

    const { data, error, success } = ReadingUpdateSchema.safeParse(req.body)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    const reading = await Reading.findByPk(rid)
    if (!reading) return res.status(404).send("Reading not found.")

    await reading.update(data)
    res.send(reading.dataValues)
}

const destroy: RequestHandler = async (req, res) => {
    const rid = req.params.rid as string
    if (!rid) return res.status(400).send("Reading id required.")

    const count = await Reading.destroy({ where: { id: rid } })
    if (count <= 0) return res.status(404).send("Reading not found.")

    return res.status(204).send("Reading deleted successfully.")
}

//

export default { get, count, post, patch, destroy }
