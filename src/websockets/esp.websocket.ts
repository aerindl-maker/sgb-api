import { RawData, WebSocket, WebSocketServer } from "ws";
import { type IncomingMessage } from "http"
import { type Duplex } from "stream";
import { EspContext, WsEvent, WsEventHandler, WsEventOptions, WsEventQuery, WsEventSchema } from "@/schemas/ws.event.schema.js";
import espService from "@/services/esp.service.js";

//

type EspSocket = { ws: WebSocket, espId: number }
type EspStatusListener = (espId: number, online: boolean) => Promise<void> | void

//

const wss = new WebSocketServer({ noServer: true, autoPong: true })
const sockets: EspSocket[] = []
const handlers: WsEventOptions<any, EspContext>[] = []
const statusListeners: EspStatusListener[] = []

wss.on("connection", (ws: WebSocket, espId: number) => onConnect(ws, espId))

//

const upgrade = async (
    req: IncomingMessage,
    socket: Duplex,
    head: NonSharedBuffer
) => {
    const header = req.headers["x-api-key"]
    const key = Array.isArray(header) ? header[0] : header
    const esp = await espService.resolve(key).catch(() => null)

    if (!esp) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
        socket.destroy()
        return console.info(`[Ws.Esp]: Esp websocket rejected unknown or disabled key.`)
    }

    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, esp.id))
}

const subscribe = async <T extends object = any>(
    name: string,
    query: WsEventQuery,
    handler: WsEventHandler<T, EspContext>
) => {
    handlers.push({ name, query, handler })
}

const onStatus = (listener: EspStatusListener) => {
    statusListeners.push(listener)
}

const send = async (targets: EspSocket[], msg: string | WsEvent) => {
    const data = typeof msg == "string" ? msg : JSON.stringify(msg)
    const promises = targets
        .filter((s) => s.ws.readyState == s.ws.OPEN)
        .map((s) => Promise.resolve().then(() => s.ws.send(data)))
    await Promise.all(promises).catch(() => {})
}

const broadcast = async <T extends object = any>(msg: string | WsEvent<T>) => {
    await send(sockets, msg)
}

const sendTo = async <T extends object = any>(espId: number, msg: string | WsEvent<T>) => {
    await send(sockets.filter((s) => s.espId == espId), msg)
}

const isOnline = (espId: number) => sockets.some((s) => s.espId == espId && s.ws.readyState == s.ws.OPEN)

const kick = (espId: number) => {
    sockets.filter((s) => s.espId == espId).forEach((s) => s.ws.close(4001, "Esp disabled."))
}

//

const notifyStatus = async (espId: number) => {
    const online = isOnline(espId)
    const onError = (e: any) => console.error(`[Ws.Esp]: Esp status listener error: ${e?.message}.`)
    await Promise.all(statusListeners.map((l) => Promise.resolve().then(() => l(espId, online)).catch(onError)))
}

const onConnect = async (ws: WebSocket, espId: number) => {
    sockets.push({ ws, espId })
    ws.on("message", onMessage(espId))
    ws.on("close", onDisconnect(ws, espId))
    console.info(`[Ws.Esp]: Esp websocket device ${espId} connected.`)
    await notifyStatus(espId)
}

const onMessage = (espId: number) => async (data: RawData, isBinary: boolean) => {
    if (isBinary) return console.info(`[Ws.Esp]: Esp websocket received binary.`)

    const dstr = data.toString()
    const json = await Promise
        .resolve()
        .then(() => JSON.parse(dstr))
        .catch(() => undefined)
    if (!json) return console.info(`[Ws.Esp]: Esp websocket received non-json message: ${dstr}.`)

    const { data: parsed, success } = WsEventSchema.safeParse(json)
    if (!success) return console.info(`[Ws.Esp]: Esp websocket received invalid event.`)

    const context: EspContext = { espId }
    const onError = (e: any) => console.error(`[Ws.Esp]: Esp websocket error: ${e?.message}.`)
    const promises = handlers
        .filter((h) => h.name == parsed.name && h.query == parsed.query)
        .map((h) => Promise.resolve().then(() => h.handler(parsed.data as object[], context)).catch(onError))
    await Promise.all(promises)
}

const onDisconnect = (ws: WebSocket, espId: number) => async (code: number, reason: Buffer) => {
    const index = sockets.findIndex((s) => s.ws == ws)
    if (index !== -1) sockets.splice(index, 1)
    console.info(`[Ws.Esp]: Esp websocket device ${espId} disconnected - ${code} - ${reason.toString()}.`)
    await notifyStatus(espId)
}

//

export default { upgrade, subscribe, onStatus, broadcast, sendTo, isOnline, kick }
