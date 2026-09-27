import { Control } from "@/models/control.model.js"
import { ControlUpdateSchema } from "@/schemas/control.schema.js"
import { WsEvent } from "@/schemas/ws.event.schema.js"
import espService from "@/services/esp.service.js"
import espWebsocket from "@/websockets/esp.websocket.js"
import { type RequestHandler } from "express"

//

const get: RequestHandler = async (req, res) => {
	const esp = await espService.find(req.query)
	if (!esp) return res.status(404).send("Esp not found.")

	const [control] = await Control.findOrCreate({ where: { espId: esp.id } })
	res.send(control.dataValues)
}

const patch: RequestHandler = async (req, res) => {
	const esp = await espService.find(req.query)
	if (!esp) return res.status(404).send("Esp not found.")

	const { data, error, success } = ControlUpdateSchema.safeParse(req.body)
	if (!success) return res.status(400).send(error.issues.at(0)?.message)

	const [control] = await Control.findOrCreate({ where: { espId: esp.id } })
	await control.update(data)
	res.send(control.dataValues)

	const event: WsEvent = { name: "Control", data: [control.dataValues], query: "Update" }
	await espWebsocket.sendTo(esp.id, event)
}

//

export default { get, patch }
