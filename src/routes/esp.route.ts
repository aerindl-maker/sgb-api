import express from "express"
import espController from "@/controllers/esp.controller.js"

//

const router = express.Router()
router.get("/", espController.get)
router.post("/", espController.post)
router.patch("/:eid", espController.patch)
router.post("/:eid/key", espController.regenerateKey)
router.delete("/:eid", espController.destroy)

//

export default { router }
