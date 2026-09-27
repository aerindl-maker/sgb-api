import crypto from "crypto"
import env from "@/config/env.config.js"
import { Esp } from "@/models/esp.model.js"
import { DEFAULT_ESP_ID, EspIdSchema } from "@/schemas/esp.schema.js"

//

const hashKey = (key: string) => crypto.createHash("sha256").update(key).digest("hex")

const generateKey = () => crypto.randomBytes(24).toString("hex")

/**
 * Finds the esp owning the api key. Unknown or missing keys fall back to the
 * default esp so already flashed boards keep working, unless strict mode is on.
 */
const resolve = async (key?: string) => {
    const owner = key ? await Esp.findOne({ where: { keyHash: hashKey(key) } }) : null
    const esp = owner ?? (env.esp.strict ? null : await Esp.findByPk(DEFAULT_ESP_ID))
    if (!esp || !esp.enabled) return null
    return esp
}

const parseId = (source: unknown) => {
    const { data, success } = EspIdSchema.safeParse(source ?? {})
    return success ? data.espId : DEFAULT_ESP_ID
}

const find = async (source: unknown) => await Esp.findByPk(parseId(source))

// --- Prefixes notifications with the esp name once there is more than one
const label = async (espId?: number | null) => {
    const count = await Esp.count()
    if (count <= 1 || espId == null) return ""
    const esp = await Esp.findByPk(espId, { attributes: ["name"] })
    return esp ? `${esp.name} · ` : ""
}

//

export default { hashKey, generateKey, resolve, parseId, find, label }
