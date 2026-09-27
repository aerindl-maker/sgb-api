import z from "zod"

//

const FaultSchema = z.object({
	id: z.coerce.number().int(),
	title: z.string().min(1),
	message: z.string().min(1),
	espId: z.coerce.number().int().nullable(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
})

const FaultQuerySchema = FaultSchema.partial()
const FaultCreateSchema = FaultSchema.pick({ title: true, message: true, espId: true }).partial({ espId: true })
const FaultUpdateSchema = FaultSchema.pick({ title: true, message: true }).partial()

//

type FaultSchema = z.infer<typeof FaultSchema>
type FaultQuerySchema = z.infer<typeof FaultQuerySchema>
type FaultCreateSchema = z.infer<typeof FaultCreateSchema>
type FaultUpdateSchema = z.infer<typeof FaultUpdateSchema>

//

export { FaultSchema, FaultQuerySchema, FaultCreateSchema, FaultUpdateSchema }
