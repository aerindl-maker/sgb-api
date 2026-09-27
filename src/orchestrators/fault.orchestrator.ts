import { Fault } from "@/models/fault.model.js"
import { type FaultCreateSchema } from "@/schemas/fault.schema.js"
import firebaseService from "@/services/firebase.service.js"
import { Notification } from "firebase-admin/messaging"
import espService from "@/services/esp.service.js"

//

const create = async (data: FaultCreateSchema) => {
	const fault = await Fault.create(data)
	const prefix = await espService.label(fault.espId)
	await notifyOwner(fault.espId, `${prefix}${fault.title}`, fault.message)
	return fault
}

const notifyOwner = async (espId: number | null | undefined, title: string, message: string) => {
	const tokens = await espService.ownerTokens(espId)
	if (!tokens.length) return

	const chunks = chunk(tokens, 500)
	const notification = createNotification(title, message)
	const nprms = chunks.map(tokens => firebaseService.fcm.sendEachForMulticast({ tokens, notification }))
	await Promise.all(nprms)
}

const chunk = <T>(items: T[], size: number) => {
	const chunks: T[][] = []
	for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
	return chunks
}

const createNotification = (title: string, message: string) =>
	({
		title,
		body: message,
	}) as Notification

//

export default { create, notifyOwner }
