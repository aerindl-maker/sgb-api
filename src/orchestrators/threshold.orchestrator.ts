import { Threshold } from "@/models/threshold.model.js";
import { ReadingSchema } from "@/schemas/reading.schema.js";
import { ThresholdSchema } from "@/schemas/threshold.schema.js";
import { Notification } from "firebase-admin/messaging";
import firebaseService from "@/services/firebase.service.js";
import espService from "@/services/esp.service.js";
import { DEFAULT_ESP_ID } from "@/schemas/esp.schema.js";

//

const evaluate = async (reading: ReadingSchema) => {
    const espId = reading.espId ?? DEFAULT_ESP_ID
    const thresholds = await Threshold.findAll({ where: { reading: reading.name, espId } })

    const triggereds = thresholds.filter((t) => isTriggered(reading, ThresholdSchema.parse(t.dataValues)))
    if (!triggereds.length) return

    const tokens = await espService.ownerTokens(espId)
    if (!tokens.length) return
    
    const prefix = await espService.label(espId)
    const notifications = triggereds.map((t) => createNotification(ThresholdSchema.parse(t.dataValues), prefix))
    const nprms = notifications.map((n) => firebaseService.fcm.sendEachForMulticast({ tokens, notification: n }))
    await Promise.all(nprms)
}

const isTriggered = (reading: ReadingSchema, threshold: ThresholdSchema) => {
    return (reading.value > threshold.value && threshold.operator == ">")
        || (reading.value >= threshold.value && threshold.operator == ">=")
        || (reading.value <= threshold.value && threshold.operator == "<=")
        || (reading.value < threshold.value && threshold.operator == "<")
        || (reading.value == threshold.value && threshold.operator == "=")
        || (reading.value != threshold.value && threshold.operator == "!=")
}

const createNotification = (threshold: ThresholdSchema, prefix = "") => ({
    title: `${prefix}${threshold.reading} Threshold Reached!`,
    body: `${threshold.message}. ${threshold.reading} is ${threshold.operator} ${threshold.value}.`
} as Notification)

//

export default { evaluate }
