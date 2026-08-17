import { RequestHandler } from "express"

//

const get: RequestHandler = async (req, res) => {
    const version = "0.0.30"
    const changes = ["In-App Update"]
    const required = true
    const url = "https://sgb-worker.iansandoval264.workers.dev/apk/v0.0.30/sgb.apk"
    return res.json({ url, version, changes, required })
}

//

export default { get }
