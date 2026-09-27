import { Op } from "sequelize"
import env from "@/config/env.config.js"
import espHandler from "@/handlers/esp.handler.js"
import espWebsocket from "@/websockets/esp.websocket.js"
import espService from "@/services/esp.service.js"
import { Esp } from "@/models/esp.model.js"
import { Reading } from "@/models/reading.model.js"
import { Threshold } from "@/models/threshold.model.js"
import { Control } from "@/models/control.model.js"
import { Fault } from "@/models/fault.model.js"
import { DEFAULT_ESP_ID } from "@/schemas/esp.schema.js"

//

// --- Rows made before multi-esp support are adopted by the default esp
const backfill = async () => {
    const where = { espId: { [Op.is]: null } } as any
    const values = { espId: DEFAULT_ESP_ID }

    const [readings] = await Reading.update(values, { where })
    const [thresholds] = await Threshold.update(values, { where })
    const [faults] = await Fault.update(values, { where })

    // --- Only one control per esp, adopt the oldest orphan
    const owned = await Control.count({ where: { espId: DEFAULT_ESP_ID } })
    const orphan = owned ? null : await Control.findOne({ where, order: [["id", "ASC"]] })
    if (orphan) await orphan.update(values)

    const total = readings + thresholds + faults + (orphan ? 1 : 0)
    if (total) console.info(`[Boot.Esp]: Adopted ${total} rows into the default esp.`)
}

const seed = async () => {
    const defaults = { id: DEFAULT_ESP_ID, name: "Default" }
    const [esp] = await Esp.findOrCreate({ where: { id: DEFAULT_ESP_ID }, defaults })

    const keyHash = env.esp.defaultKey ? espService.hashKey(env.esp.defaultKey) : null
    if (keyHash && esp.keyHash != keyHash) await esp.update({ keyHash })
}

const boot = async () => {
    await seed()
    await backfill()

    await espWebsocket.subscribe("Reading", "Create", espHandler.onCreateReading)
    await espWebsocket.subscribe("Threshold", "Retrieve", espHandler.onRetrieveThreshold)
    await espWebsocket.subscribe("Control", "Retrieve", espHandler.onRetrieveControl)
    espWebsocket.onStatus(espHandler.onStatus)
    console.info("[Boot.Esp]: Websocket handlers attached.")
}

//

export default { boot }
