import z from "zod";

//

const CaptureSchema = z.object({
    id: z.coerce.number().int(),
    image: z.string().min(1),
    object: z.string().min(1),
    espId: z.coerce.number().int().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})

const CaptureQuerySchema = CaptureSchema.partial()
const CaptureCreateSchema = CaptureSchema.pick({ object: true })
const CaptureUpdateSchema = CaptureSchema.pick({ object: true }).partial()

//

type CaptureSchema = z.infer<typeof CaptureSchema>
type CaptureQuerySchema = z.infer<typeof CaptureQuerySchema>
type CaptureCreateSchema = z.infer<typeof CaptureCreateSchema>
type CaptureUpdateSchema = z.infer<typeof CaptureUpdateSchema>

//

export { CaptureSchema, CaptureQuerySchema, CaptureCreateSchema, CaptureUpdateSchema }
