import espHandler from "@/handlers/esp.handler.js"
import espWebsocket from "@/websockets/esp.websocket.js"

//

const boot = async () => {
    await espWebsocket.subscribe("Reading", "Create", espHandler.onCreateReading)
    await espWebsocket.subscribe("Threshold", "Retrieve", espHandler.onRetrieveThreshold)
    await espWebsocket.subscribe("Control", "Retrieve", espHandler.onRetrieveControl)
    console.info("[Boot.Esp]: Websocket handlers attached.")
}

//

export default { boot }
