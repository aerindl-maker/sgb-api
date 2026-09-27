import crypto from "crypto"
import env from "@/config/env.config.js"
import { Esp } from "@/models/esp.model.js"
import { Device } from "@/models/device.model.js"
import { Reading } from "@/models/reading.model.js"
import { Threshold } from "@/models/threshold.model.js"
import { Control } from "@/models/control.model.js"
import { Fault } from "@/models/fault.model.js"
import { Capture } from "@/models/capture.model.js"
import { DEFAULT_ESP_ID, EspIdSchema } from "@/schemas/esp.schema.js"
import { type UserSafeSchema } from "@/schemas/user.schema.js"

//

const hashKey = (key: string) => crypto.createHash("sha256").update(key).digest("hex")

const generateKey = () => crypto.randomBytes(24).toString("hex")

/**
 * Finds the esp owning the api key. The default esp takes boards without a key, and
 * unknown keys too while its own key isn't configured, so the legacy board keeps
 * working. Once it is, unknown keys (deleted or re-keyed boards) are rejected.
 */
const resolve = async (key?: string) => {
    const owner = key ? await Esp.findOne({ where: { keyHash: hashKey(key) } }) : null
    const fallback = !env.esp.strict && (!key || !env.esp.defaultKey)
    const esp = owner ?? (fallback ? await Esp.findByPk(DEFAULT_ESP_ID) : null)
    if (!esp || !esp.enabled) return null
    return esp
}

const parseId = (source: unknown) => {
    const { data, success } = EspIdSchema.safeParse(source ?? {})
    return success ? data.espId : DEFAULT_ESP_ID
}

//

const isAdmin = (user?: UserSafeSchema) => user?.role == "Admin"

// --- Admins may reach any esp, everyone else only their own
const findOwned = async (user: UserSafeSchema | undefined, source: unknown) => {
    if (!user) return null
    const id = parseId(source)
    const where = isAdmin(user) ? { id } : { id, userId: user.id }
    return await Esp.findOne({ where })
}

const owns = async (user: UserSafeSchema | undefined, espId?: number | null) => {
    if (!user) return false
    if (isAdmin(user)) return true
    if (espId == null) return false
    return (await Esp.count({ where: { id: espId, userId: user.id } })) > 0
}

// --- Every esp id the user may reach, undefined meaning all of them for admins
const ownedIds = async (user?: UserSafeSchema) => {
    if (isAdmin(user)) return undefined
    if (!user) return []
    const esps = await Esp.findAll({ where: { userId: user.id }, attributes: ["id"] })
    return esps.map((e) => e.id)
}

const ownerId = async (espId?: number | null) => {
    if (espId == null) return null
    const esp = await Esp.findByPk(espId, { attributes: ["userId"] })
    return esp?.userId ?? null
}

// --- Push tokens of the phones signed in as the esp's owner
const ownerTokens = async (espId?: number | null) => {
    const userId = await ownerId(espId)
    if (userId == null) return []
    const devices = await Device.findAll({ where: { userId }, attributes: ["token"] })
    return [...new Set(devices.map((d) => d.token).filter(Boolean))]
}

/**
 * Permanently removes an esp with everything it recorded, in one transaction.
 * Detections and plant heights go with their captures through the database cascade.
 * Returns the capture image names so the caller can clear them from storage.
 */
const purge = async (esp: Esp) => {
    const sequelize = Esp.sequelize
    if (!sequelize) throw new Error("Database is not initialized.")

    return await sequelize.transaction(async (transaction) => {
        const where = { espId: esp.id }
        const captures = await Capture.findAll({ where, attributes: ["image"], transaction })

        await Capture.destroy({ where, transaction })
        await Reading.destroy({ where, transaction })
        await Threshold.destroy({ where, transaction })
        await Control.destroy({ where, transaction })
        await Fault.destroy({ where, transaction })
        await esp.destroy({ transaction })

        return captures.map((c) => c.image)
    })
}

// --- Prefixes notifications with the esp name once its owner has more than one
const label = async (espId?: number | null) => {
    if (espId == null) return ""
    const esp = await Esp.findByPk(espId, { attributes: ["name", "userId"] })
    if (!esp) return ""
    const count = await Esp.count({ where: { userId: esp.userId } })
    return count > 1 ? `${esp.name} · ` : ""
}

//

export default { hashKey, generateKey, resolve, parseId, isAdmin, findOwned, owns, ownedIds, ownerId, ownerTokens, purge, label }
