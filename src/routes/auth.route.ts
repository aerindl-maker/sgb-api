import authController from "@/controllers/auth.controller.js"
import jwtMiddleware from "@/middlewares/jwt.middleware.js"
import express from "express"

//

const router = express.Router()
router.get("/me", jwtMiddleware.requireAuthToken, authController.getMe)
router.post("/sign-in", authController.signIn)
router.post("/sign-out", authController.signOut)
router.post("/forgot-password", authController.forgotPassword)
router.post("/reset-password", authController.resetPassword)

//

export default { router }
