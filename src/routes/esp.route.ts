import express from "express"
import espController from "@/controllers/esp.controller.js"
import roleMiddleware from "@/middlewares/role.middleware.js"

//

const router = express.Router()
router.get("/", espController.get)
router.post("/", roleMiddleware.requireUserRole("Admin"), espController.post)
router.patch("/:eid", roleMiddleware.requireUserRole("Admin"), espController.patch)
router.post("/:eid/key", roleMiddleware.requireUserRole("Admin"), espController.regenerateKey)
router.delete("/:eid", roleMiddleware.requireUserRole("Admin"), espController.destroy)

//

export default { router }
