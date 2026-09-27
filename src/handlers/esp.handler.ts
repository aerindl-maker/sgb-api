import { EspContext, WsEvent, WsEventHandler } from "@/schemas/ws.event.schema.js"
import { Reading } from "@/models/reading.model.js"
import { ReadingCreateSchema } from "@/schemas/reading.schema.js"
import appWebsocket from "@/websockets/app.websocket.js"
import thresholdOrchestrator from "@/orchestrators/threshold.orchestrator.js"
import faultOrchestrator from "@/orchestrators/fault.orchestrator.js"
import { Threshold } from "@/models/threshold.model.js"
import espWebsocket from "@/websockets/esp.websocket.js"
import { Control } from "@/models/control.model.js"
import { Esp } from "@/models/esp.model.js"

//

const readingSensorMap = new Map<string, string>([
	["Temperature", "DHT22"],
	["Humidity", "DHT22"],
	["Soil Moisture", "Soil Moisture Sensor"],
	["Light", "BH1750"],
])

//

const onCreateReading: WsEventHandler<ReadingCreateSchema, EspContext> = async (data, { espId }) => {
	await Esp.update({ lastSeenAt: new Date() }, { where: { id: espId } })

	// --- Handle Faulty Readings
	const faultyReadings = data.filter(r => r.value == null)
	const faults = faultyReadings.map(r => ({
		espId,
		title: `${readingSensorMap.get(r.name)} Faulty`,
		message: `${readingSensorMap.get(r.name)} ${r.name.toLowerCase()} reading null.`
	}))
	const fprms = faults.map(f => faultOrchestrator.create(f))

	// --- Handle Valid Readings
	const readings = data.filter(r => r.value != null).map(r => ({ ...r, espId }))
	if (readings.length <= 0) return
	const inserted = await Reading.bulkCreate(readings)

	// --- Emit
	const values = inserted.map(i => i.dataValues)
	const event: WsEvent = { name: "Reading", query: "Create", data: values }
	await appWebsocket.broadcast(event, espId)

	const eprms = values.map(r => thresholdOrchestrator.evaluate(r))
	await Promise.all([...eprms, ...fprms])
}

const onRetrieveThreshold: WsEventHandler<object, EspContext> = async (_, { espId }) => {
	const thresholds = await Threshold.findAll({ where: { espId }, raw: true })
	const event: WsEvent = { name: "Threshold", query: "Update", data: thresholds }
	await espWebsocket.sendTo(espId, event)
}

const onRetrieveControl: WsEventHandler<object, EspContext> = async (_, { espId }) => {
	const [control] = await Control.findOrCreate({ where: { espId } })
	const event: WsEvent = { name: "Control", query: "Update", data: [control.dataValues] }
	await espWebsocket.sendTo(espId, event)
}

// --- Keeps apps aware of which esps are online
const onStatus = async (espId: number, online: boolean) => {
	await Esp.update({ lastSeenAt: new Date() }, { where: { id: espId } })
	const esp = await Esp.findByPk(espId, { attributes: { exclude: ["keyHash"] }, raw: true })
	if (!esp) return
	const event: WsEvent = { name: "Esp", query: "Update", data: [{ ...esp, online }] }
	await appWebsocket.broadcast(event, espId)
}

//

export default { onCreateReading, onRetrieveThreshold, onRetrieveControl, onStatus }
