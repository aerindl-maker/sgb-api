import { Fault } from "@/models/fault.model.js"
import { PaginationSchema } from "@/schemas/pagination.schema.js"
import { FaultQuerySchema } from "@/schemas/fault.schema.js"
import { type RequestHandler } from "express"
import { Op } from "sequelize"
import { DEFAULT_ESP_ID } from "@/schemas/esp.schema.js"
import espService from "@/services/esp.service.js"

//

const get: RequestHandler = async (req, res) => {
	const { data, error, success } = PaginationSchema.and(FaultQuerySchema).safeParse(req.query)
	if (!success) return res.status(400).send(error.issues.at(0)?.message)

	const keys = Object.keys(PaginationSchema.shape)
	const entries = Object.entries(data).filter(([k, v]) => !keys.includes(k) && v != undefined)

	const { alpha, omega, limit, offset } = data
	const where: any = Object.fromEntries(entries)
	where.espId = data.espId ?? DEFAULT_ESP_ID
	const createdAt = { ...(alpha && { [Op.gte]: alpha }), ...(omega && { [Op.lte]: omega }) }
	if (Object.keys(createdAt).length) where.createdAt = createdAt
	if (!(await espService.owns(req.user, where.espId))) return res.status(404).send("Esp not found.")

	const faults = await Fault.findAll({ where, raw: true, limit, offset, order: [["createdAt", "DESC"]] })
	res.send(faults)
}

//

export default { get }
