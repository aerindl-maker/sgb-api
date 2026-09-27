import { RawData, WebSocket, WebSocketServer } from "ws";
import { type IncomingMessage } from "http"
import { type Duplex } from "stream";
import { WsEvent, WsEventHandler, WsEventOptions, WsEventQuery, WsEventSchema } from "@/schemas/ws.event.schema.js";
import { DEFAULT_ESP_ID } from "@/schemas/esp.schema.js";
import { type UserSafeSchema } from "@/schemas/user.schema.js";
import espService from "@/services/esp.service.js";
import env from "@/config/env.config.js";
import jwt from "jsonwebtoken";

//

// --- Legacy apps connect without a scope and only understand the default esp
type AppSocket = { ws: WebSocket, all: boolean, userId?: number }

//

const wss = new WebSocketServer({ noServer: true, autoPong: true })
const sockets: AppSocket[] = []
const handlers: WsEventOptions<any>[] = []

wss.on("connection", (ws: WebSocket, all: boolean, userId?: number) => onConnect(ws, all, userId))

//

// --- Same auth cookie the rest api uses
const readUser = (req: IncomingMessage) => {
    const token = req.headers.cookie
        ?.split(";")
        .map((part) => part.trim().split("="))
        .find(([name]) => name == "token")?.[1]
    if (!token) return undefined

    try {
        return jwt.verify(decodeURIComponent(token), env.jwt.secret) as UserSafeSchema
    } catch {
        return undefined
    }
}

//

const upgrade = async (
    req: IncomingMessage,
    socket: Duplex,
    head: NonSharedBuffer
) => {
    const all = new URL(req.url!, "http://localhost").searchParams.get("esp") == "all"
    const user = readUser(req)
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, all, user?.id))
}

const subscribe = async <T extends object = any>(
    name: string,
    query: WsEventQuery,
    handler: WsEventHandler<T>
) => {
    handlers.push({ name, query, handler })
}

/**
 * Sends an esp's event to its owner. Signed-out legacy sockets keep receiving the
 * default esp as before, since old app builds may connect without the cookie.
 */
const broadcast = async <T extends object = any>(msg: string | WsEvent<T>, espId: number) => {
    const data = typeof msg == "string" ? msg : JSON.stringify(msg)
    const legacy = espId == DEFAULT_ESP_ID
    const ownerId = await espService.ownerId(espId)
    const promises = sockets
        .filter((s) => s.all || legacy)
        .filter((s) => s.userId == undefined ? !s.all : s.userId == ownerId)
        .filter((s) => s.ws.readyState == s.ws.OPEN)
        .map((s) => Promise.resolve().then(() => s.ws.send(data)))
    await Promise.all(promises).catch(() => {})
}

//

const onConnect = async (ws: WebSocket, all: boolean, userId?: number) => {
    sockets.push({ ws, all, userId })
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
