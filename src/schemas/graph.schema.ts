import z from "zod"
import { Op } from "sequelize"

//

const GraphQuerySchema = z.object({
	period: z.enum(["today", "week", "month", "year"]).optional(),
	timezoneOffset: z.coerce.number().int().min(-840).max(720).default(0),
})

// --- Offset follows Date.getTimezoneOffset(); weeks start on Monday.
const buildGraphCreatedAt = (query: z.infer<typeof GraphQuerySchema>) => {
	if (!query.period) return undefined

	const offset = query.timezoneOffset * 60 * 1000
	const now = new Date()
	const start = new Date(now.getTime() - offset)
	start.setUTCHours(0, 0, 0, 0)
	if (query.period === "week") start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7))
	if (query.period === "month") start.setUTCDate(1)
	if (query.period === "year") start.setUTCMonth(0, 1)

	return { [Op.gte]: new Date(start.getTime() + offset), [Op.lte]: now }
}

//

export { GraphQuerySchema, buildGraphCreatedAt }
