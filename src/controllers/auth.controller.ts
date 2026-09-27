import env from "@/config/env.config.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import crypto from "crypto"
import mailService from "@/services/mail.service.js"
import { User } from "@/models/user.model.js"
import { PasswordReset } from "@/models/password-reset.model.js"
import { RequestHandler } from "express"
import {
    UserSafeSchema,
    UserSignInSchema,
    UserForgotPasswordSchema,
    UserResetPasswordSchema,
} from "@/schemas/user.schema.js"

//

const getMe: RequestHandler = async (req, res) => {
    if (!req.user) return res.status(401).send("Authorization required.")
    const user = await User.findByPk(req.user.id, { raw: true })
    if (!user) return res.status(404).send("User not found.")
    res.send(user)
}

const signIn: RequestHandler = async (req, res) => {
    const { data, error, success } = UserSignInSchema.safeParse(req.body)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    const user = await User.findOne({ where: { email: data.email }, raw: true })
    if (!user) return res.status(400).send("Incorrect credentials provided.")

    const matched = await bcrypt.compare(data.password, user.password)
    if (!matched) return res.status(400).send("Incorrect credentials provided.")

    const payload = UserSafeSchema.parse(user)
    const token = jwt.sign(payload, env.jwt.secret, { expiresIn: "1Day" })
    
    res.cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: "none",
    })
    
    res.send(payload)
}

const signOut: RequestHandler = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    })

    res.status(204).send("User signed-out successfully.")
}

const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

const otpMail = (name: string, code: string) => {
    const minutes = env.otp.expiry
    const text = `Hi ${name},

Your Smart Germination Box password reset code is ${code}. It expires in ${minutes} minutes.

If you did not request this, you can ignore this email.`
    const html = `
<div style="background:#ecfae9;padding:32px 16px;font-family:'DM Sans',Arial,sans-serif;color:#1e2420">
  <div style="max-width:420px;margin:0 auto;background:#f9faf9;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(180deg,#008a17 0%,#39d353 100%);padding:20px;text-align:center;color:#ffffff;font-weight:700;font-size:18px">Smart Germination Box</div>
    <div style="padding:24px;text-align:center">
      <p style="margin:0 0 8px">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 20px">Use this code to reset your password.</p>
      <div style="display:inline-block;padding:12px 20px;border-radius:8px;background:#ecfae9;color:#008a17;font-size:28px;font-weight:700;letter-spacing:8px">${code}</div>
      <p style="margin:20px 0 0;font-size:13px;color:#6b7280">It expires in ${minutes} minutes. If you did not request this, you can ignore this email.</p>
    </div>
  </div>
</div>`
    return { subject: "Your password reset code", text, html }
}

// --- Always answers the same so emails can't be probed, admin resets through its env instead
const forgotPassword: RequestHandler = async (req, res) => {
    const { data, error, success } = UserForgotPasswordSchema.safeParse(req.body)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    const user = await User.findOne({ where: { email: data.email }, raw: true })
    if (!user || user.role == "Admin") return res.status(204).send()

    const existing = await PasswordReset.findOne({ where: { userId: user.id } })
    const cooling = existing && Date.now() - existing.updatedAt.getTime() < env.otp.cooldown * 1000
    if (cooling) return res.status(204).send()

    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0")
    const hashed = await bcrypt.hash(code, 10)
    const expiresAt = new Date(Date.now() + env.otp.expiry * 60 * 1000)

    try {
        await mailService.send({ to: user.email, ...otpMail(user.name, code) })
    } catch (e) {
        console.error(e)
        return res.status(502).send("Failed to send the reset code.")
    }

    if (existing) await existing.update({ code: hashed, attempts: 0, expiresAt, updatedAt: new Date() })
    else await PasswordReset.create({ userId: user.id, code: hashed, expiresAt })

    res.status(204).send()
}

const resetPassword: RequestHandler = async (req, res) => {
    const { data, error, success } = UserResetPasswordSchema.safeParse(req.body)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    const invalid = "Invalid or expired code."
    const user = await User.findOne({ where: { email: data.email } })
    if (!user || user.role == "Admin") return res.status(400).send(invalid)

    const reset = await PasswordReset.findOne({ where: { userId: user.id } })
    if (!reset) return res.status(400).send(invalid)

    if (reset.expiresAt.getTime() < Date.now() || reset.attempts >= env.otp.attempts) {
        await reset.destroy()
        return res.status(400).send(invalid)
    }

    const matched = await bcrypt.compare(data.code, reset.code)
    if (!matched) {
        await reset.increment("attempts")
        return res.status(400).send(invalid)
    }

    const hashed = await bcrypt.hash(data.password, 10)
    await user.update({ password: hashed })
    await reset.destroy()

    res.status(204).send()
}

//

export default { getMe, signIn, signOut, forgotPassword, resetPassword }
