import { Capture } from "@/models/capture.model.js";
import espService from "@/services/esp.service.js";
import { DetectionSchema } from "@/schemas/detection.schema.js";
import firebaseService from "@/services/firebase.service.js";
import { Notification } from "firebase-admin/messaging";

//

const evaluate = async (detections: DetectionSchema[]) => {
    const diseases = detections.filter((d) => isDisease(d))
    if (!diseases.length) return

    // --- Only the owner of the capture's esp is notified
    const capture = await Capture.findByPk(diseases[0]!.captureId, { attributes: ["espId"] })
    const tokens = await espService.ownerTokens(capture?.espId)
    if (!tokens.length) return

    const notification = createNotification(diseases)
    await firebaseService.fcm.sendEachForMulticast({ tokens, notification })
}

const isDisease = (detection: DetectionSchema) => !detection.class.trim().toLowerCase().startsWith("healthy")

const createNotification = (detections: DetectionSchema[]) => {
    const classes = detections.map((d) => d.class)
    const totalConfidence = detections.reduce((p, c) => p + c.confidence, 0)
    const avgConfidence = (totalConfidence * 100).toFixed(2)
    const title = `Diseases Detected!`
    const body = `${classes.join(", ")} diseases are detected with average confidence of ${avgConfidence}%.`
    return { title, body } as Notification
}

//

export default { evaluate }
