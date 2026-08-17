import { Control } from "@/models/control.model.js"
import { ControlUpdateSchema } from "@/schemas/control.schema.js"
import { WsEvent } from "@/schemas/ws.event.schema.js"
import espWebsocket from "@/websockets/esp.websocket.js"
import { type RequestHandler } from "express"

//

const controlId = 1

//

const get: RequestHandler = async (req, res) => {
	const [control] = await Control.findOrCreate({ where: { id: controlId } })
	res.send(control.dataValues)
}

const patch: RequestHandler = async (req, res) => {
	const { data, error, success } = ControlUpdateSchema.safeParse(req.body)
	if (!success) return res.status(400).send(error.issues.at(0)?.message)

	const [control] = await Control.findOrCreate({ where: { id: controlId } })
	await control.update(data)
	res.send(control.dataValues)

	const event: WsEvent = { name: "Control", data: [control.dataValues], query: "Update" }
	await espWebsocket.broadcast(event)
}

//

export default { get, patch }
