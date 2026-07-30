import express from "express"
import jwtMiddleware from "@/middlewares/jwt.middleware.js"
import authRoute from "@/routes/auth.route.js"
import userRoute from "@/routes/user.route.js"
import captureRoute from "@/routes/capture.route.js"
import readingRoute from "@/routes/reading.route.js"
import thresholdRoute from "@/routes/threshold.route.js"
import roleMiddleware from "@/middlewares/role.middleware.js"
import deviceRoute from "@/routes/device.route.js"
import faultRoute from "@/routes/fault.route.js"
import versionController from "@/controllers/version.controller.js"
import { plantRouter } from "@/modules/plant/route.js"

//

const router = express.Router()
router.use("/auth", authRoute.router)
router.use("/user", jwtMiddleware.requireAuthToken, roleMiddleware.requireUserRole("Admin"), userRoute.router)
router.use("/device", jwtMiddleware.requireAuthToken, deviceRoute.router)
router.use("/fault", jwtMiddleware.requireAuthToken, faultRoute.router)
router.use("/plant", jwtMiddleware.requireAuthToken, plantRouter)
router.use("/capture", jwtMiddleware.requireAuthToken, captureRoute.router)
router.use("/reading", jwtMiddleware.requireAuthToken, readingRoute.router)
router.use("/threshold", jwtMiddleware.requireAuthToken, thresholdRoute.router)
router.get("/version", versionController.get)

//

export default { router }
