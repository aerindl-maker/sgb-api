import { RawData, WebSocket, WebSocketServer } from "ws";
import { type IncomingMessage } from "http"
import { type Duplex } from "stream";
import { WsEvent, WsEventHandler, WsEventOptions, WsEventQuery, WsEventSchema } from "@/schemas/ws.event.schema.js";
import { DEFAULT_ESP_ID } from "@/schemas/esp.schema.js";

//

// --- Legacy apps connect without a scope and only understand the default esp
type AppSocket = { ws: WebSocket, all: boolean }

//

const wss = new WebSocketServer({ noServer: true, autoPong: true })
const sockets: AppSocket[] = []
const handlers: WsEventOptions<any>[] = []

wss.on("connection", (ws: WebSocket, all: boolean) => onConnect(ws, all))

//

const upgrade = async (
    req: IncomingMessage,
    socket: Duplex,
    head: NonSharedBuffer
) => {
    const all = new URL(req.url!, "http://localhost").searchParams.get("esp") == "all"
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, all))
}

const subscribe = async <T extends object = any>(
    name: string,
    query: WsEventQuery,
    handler: WsEventHandler<T>
) => {
    handlers.push({ name, query, handler })
}

const broadcast = async <T extends object = any>(msg: string | WsEvent<T>, espId?: number | null) => {
    const data = typeof msg == "string" ? msg : JSON.stringify(msg)
    const legacy = espId == null || espId == DEFAULT_ESP_ID
    const promises = sockets
        .filter((s) => s.all || legacy)
        .filter((s) => s.ws.readyState == s.ws.OPEN)
        .map((s) => Promise.resolve().then(() => s.ws.send(data)))
    await Promise.all(promises).catch(() => {})
}

//

const onConnect = async (ws: WebSocket, all: boolean) => {
    sockets.push({ ws, all })
    ws.on("message", onMessage)
    ws.on("close", onDisconnect(ws))
    console.info(`[Ws.App]: [Ws.App]: App websocket device connected.`)
}

const onMessage = async (data: RawData, isBinary: boolean) => {
    if (isBinary) return console.info(`[Ws.App]: App websocket received binary.`)

    const dstr = data.toString()
    const json = await Promise
        .resolve()
        .then(() => JSON.parse(dstr))
        .catch(() => undefined)
    if (!json) return console.info(`[Ws.App]: App websocket received non-json message: ${dstr}.`)

    const { data: parsed, success } = WsEventSchema.safeParse(json)
    if (!success) return console.info(`[Ws.App]: App websocket received invalid event.`)

    const onError = (e: any) => console.error(`[Ws.App]: App websocket error: ${e?.message}.`)
    const promises = handlers
        .filter((h) => h.name == parsed.name && h.query == parsed.query)
        .map((h) => Promise.resolve().then(() => h.handler(parsed.data as object[], undefined)).catch(onError))
    await Promise.all(promises)
}

const onDisconnect = (ws: WebSocket) => async (code: number, reason: Buffer) => {
    const index = sockets.findIndex((s) => s.ws == ws)
    if (index !== -1) sockets.splice(index, 1)
    console.info(`[Ws.App]: App websocket device disconnected - ${code} - ${reason.toString()}.`)
}

//

export default { upgrade, subscribe, broadcast }
