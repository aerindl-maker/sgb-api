import z from "zod"

//

const ControlActuator = ["pump", "intake", "exhaust", "light"] as const
type ControlActuator = (typeof ControlActuator)[number]

//

const ControlSchema = z.object({
	id: z.coerce.number().int(),
	automation: z.boolean(),
	pump: z.boolean(),
	intake: z.boolean(),
	exhaust: z.boolean(),
	light: z.boolean(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
})

const ControlUpdateSchema = ControlSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial()

//

type ControlSchema = z.infer<typeof ControlSchema>
type ControlUpdateSchema = z.infer<typeof ControlUpdateSchema>

//

export { ControlActuator, ControlSchema, ControlUpdateSchema }
