import z from "zod"

//

// --- Rows created before multi-esp support belong to this esp
const DEFAULT_ESP_ID = 1

//

const EspSchema = z.object({
    id: z.coerce.number().int(),
    name: z.string().trim().min(1).max(64),
    enabled: z.coerce.boolean(),
    lastSeenAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})

const EspCreateSchema = EspSchema.pick({ name: true })
const EspUpdateSchema = EspSchema.pick({ name: true, enabled: true }).partial()

// --- Optional esp id for requests, legacy clients omit it
const EspIdSchema = z.object({ espId: z.coerce.number().int().positive().default(DEFAULT_ESP_ID) })

//

type EspSchema = z.infer<typeof EspSchema>
type EspCreateSchema = z.infer<typeof EspCreateSchema>
type EspUpdateSchema = z.infer<typeof EspUpdateSchema>
type EspIdSchema = z.infer<typeof EspIdSchema>

//

export { DEFAULT_ESP_ID, EspSchema, EspCreateSchema, EspUpdateSchema, EspIdSchema }
