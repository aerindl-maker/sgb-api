import { Esp } from "@/models/esp.model.js"
import { DEFAULT_ESP_ID, EspCreateSchema, EspUpdateSchema } from "@/schemas/esp.schema.js"
import espService from "@/services/esp.service.js"
import espWebsocket from "@/websockets/esp.websocket.js"
import { type RequestHandler } from "express"
import fs from "fs/promises"
import env from "@/config/env.config.js"
import supabaseService from "@/services/supabase.service.js"

//

// --- Never expose the key hash, attach live connection status
const toSafe = (esp: Esp) => {
    const { keyHash, userId, ...safe } = esp.get({ plain: true })
    return { ...safe, lastSeenAt: safe.lastSeenAt ?? null, online: espWebsocket.isOnline(esp.id) }
}

//

// --- Everyone, admins included, lists only the esps they own
const get: RequestHandler = async (req, res) => {
    const esps = await Esp.findAll({ where: { userId: req.user!.id }, order: [["id", "ASC"]] })
    res.send(esps.map(toSafe))
}

const post: RequestHandler = async (req, res) => {
    const { data, error, success } = EspCreateSchema.safeParse(req.body)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    const key = espService.generateKey()
    const esp = await Esp.create({ ...data, keyHash: espService.hashKey(key), userId: req.user!.id })

    // --- The raw key is only ever shown once
    res.send({ ...toSafe(esp), key })
}

const patch: RequestHandler = async (req, res) => {
    const eid = Number(req.params.eid)
    if (!eid) return res.status(400).send("Esp id required.")

    const { data, error, success } = EspUpdateSchema.safeParse(req.body)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)
    if (eid == DEFAULT_ESP_ID && data.enabled === false) return res.status(400).send("Default esp can't be disabled.")

    const esp = await espService.findOwned(req.user, { espId: eid })
    if (!esp) return res.status(404).send("Esp not found.")

    await esp.update(data)
    if (!esp.enabled) espWebsocket.kick(esp.id)
    res.send(toSafe(esp))
}

const regenerateKey: RequestHandler = async (req, res) => {
    const eid = Number(req.params.eid)
    if (!eid) return res.status(400).send("Esp id required.")

    const esp = await espService.findOwned(req.user, { espId: eid })
    if (!esp) return res.status(404).send("Esp not found.")

    const key = espService.generateKey()
    await esp.update({ keyHash: espService.hashKey(key) })
    espWebsocket.kick(esp.id)
    res.send({ ...toSafe(esp), key })
}

// --- Permanent, the esp and all its history are gone. Disabling is done through patch.
const destroy: RequestHandler = async (req, res) => {
    const eid = Number(req.params.eid)
    if (!eid) return res.status(400).send("Esp id required.")
    if (eid == DEFAULT_ESP_ID) return res.status(400).send("Default esp can't be deleted.")

    const esp = await espService.findOwned(req.user, { espId: eid })
    if (!esp) return res.status(404).send("Esp not found.")

    espWebsocket.kick(esp.id)
    const images = await espService.purge(esp)
    res.status(204).send("Esp deleted successfully.")

    // --- Rows are already gone, so leftover files are only logged
    const local = images.map((image) => fs.unlink(`${process.cwd()}/${env.multer.path}/${image}`).catch(() => undefined))
    const remote = images.length ? supabaseService.supabase.storage.from("images").remove(images) : undefined
    await Promise.all([...local, remote]).catch((e) => console.error(`[Esp]: Leftover images of esp ${eid}: ${e?.message}.`))
}

//

export default { get, post, patch, regenerateKey, destroy }
