import { RequestHandler } from "express"

//

const get: RequestHandler = async (req, res) => {
    const version = "0.0.34"
    const changes = ["In-App Update"]
    const required = false
    const url = "https://sgb-worker.iansandoval264.workers.dev/apk/v0.0.34/sgb.apk"
    return res.json({ url, version, changes, required })
}

//

export default { get }
