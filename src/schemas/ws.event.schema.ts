import { z } from "zod"

//

const WsEventQuery = ["Create", "Retrieve", "Update", "Delete"] as const
type WsEventQuery = (typeof WsEventQuery)[number]

//

type WsEventHandler<T extends object = object, C = undefined> = (data: T[], context: C) => Promise<void> | void

type WsEventOptions<T extends object = object, C = undefined> = {
	name: string
	query: WsEventQuery
	handler: WsEventHandler<T, C>
}

type WsEvent<T extends object = object> = {
	name: string
	data: T[]
	query: WsEventQuery
}

// --- Identifies which esp sent the event
type EspContext = { espId: number }

//

const WsEventSchema = z.object({
    name: z.string().min(1),
    data: z.array(z.unknown()),
    query: z.enum(WsEventQuery),
})

type WsEventSchema = z.infer<typeof WsEventSchema>

//

export { WsEventQuery, WsEventSchema }
export type { WsEvent, WsEventOptions, WsEventHandler, EspContext }
