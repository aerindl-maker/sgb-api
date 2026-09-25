import multerMiddleware from "@/middlewares/multer.middleware.js"
import roleMiddleware from "@/middlewares/role.middleware.js"
import { validateBody, validateQuery } from "@/middlewares/validate.middleware.js"
import {
	countHeightsController,
	createPixelToCmRatioController,
	createPlantCaptureController,
	listHeightsController,
	listPixelToCmRatiosController,
} from "@/modules/plant/controller.js"
import {
	countPlantHeightsQuerySchema,
	createPixelToCmRatioBodySchema,
	createPlantCaptureBodySchema,
	listPlantHeightsQuerySchema,
} from "@/modules/plant/schema.js"
import express from "express"

//

const router = express.Router()

router.get("/heights", validateQuery(listPlantHeightsQuerySchema), listHeightsController)
router.get("/heights/count", validateQuery(countPlantHeightsQuerySchema), countHeightsController)
router.get("/pixel-to-cm-ratios", listPixelToCmRatiosController)
router.post(
	"/pixel-to-cm-ratios",
	roleMiddleware.requireUserRole("Admin"),
	validateBody(createPixelToCmRatioBodySchema),
	createPixelToCmRatioController
)
router.post(
	"/captures",
	multerMiddleware.memoryUpload.single("image"),
	validateBody(createPlantCaptureBodySchema),
	createPlantCaptureController
)

//

export { router as plantRouter }
