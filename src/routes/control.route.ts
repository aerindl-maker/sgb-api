import express from "express"
import controlController from "@/controllers/control.controller.js"

//

const router = express.Router()
router.get("/", controlController.get)
router.patch("/", controlController.patch)

//

export default { router }
