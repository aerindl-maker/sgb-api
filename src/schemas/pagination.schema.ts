import z from "zod";

//

const PaginationSchema = z.object({
    alpha: z.coerce.date().optional(),
    omega: z.coerce.date().optional(),
    limit: z.coerce.number().int().default(25),
    offset: z.coerce.number().int().default(0),
    order: z.enum(["asc", "desc"]).optional(),
})

//

type PaginationSchema = z.infer<typeof PaginationSchema>

//

export { PaginationSchema }
