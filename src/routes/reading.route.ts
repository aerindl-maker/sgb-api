import express from "express"
import readingController from "@/controllers/reading.controller.js"

//

const router = express.Router()
router.get("/", readingController.get)
router.get("/count", readingController.count)
router.post("/", readingController.post)
router.patch("/:rid", readingController.patch)
router.delete("/:rid", readingController.destroy)

//

export default { router }
