import fs from "fs/promises"
import { Capture } from "@/models/capture.model.js"
import { CaptureCreateSchema, CaptureQuerySchema, CaptureUpdateSchema } from "@/schemas/capture.schema.js"
import { PaginationSchema } from "@/schemas/pagination.schema.js"
import { type RequestHandler } from "express"
import { Op } from "sequelize"
import env from "@/config/env.config.js"
import supabaseService from "@/services/supabase.service.js"
import espService from "@/services/esp.service.js"
import { DEFAULT_ESP_ID } from "@/schemas/esp.schema.js"

//

const get: RequestHandler = async (req, res, next) => {
    const { data, error, success } = PaginationSchema.and(CaptureQuerySchema).safeParse(req.query)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    const keys = Object.keys(PaginationSchema.shape)
    const entries = Object.entries(data).filter(([k, v]) => !keys.includes(k) && v != undefined)

    const { alpha, omega, limit, offset } = data
    const where: any = Object.fromEntries(entries)
    const createdAt = { ...(alpha && { [Op.gte]: alpha }), ...(omega && { [Op.lte]: omega }) }
    if (Object.keys(createdAt).length) where.createdAt = createdAt
    where.espId = data.espId ?? DEFAULT_ESP_ID
    if (!(await espService.owns(req.user, where.espId))) return res.status(404).send("Esp not found.")

    const captures = await Capture.findAll({ where, raw: true, limit, offset })
    res.send(captures)
}

const post: RequestHandler = async (req, res, next) => {
    if (!req.file) return res.status(400).send("Image file not found.")
    
    const { data, error, success } = CaptureCreateSchema.safeParse(req.body)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    const esp = await espService.findOwned(req.user, req.body)
    if (!esp) return res.status(404).send("Esp not found.")
    
    await supabaseService.supabase.storage
        .from("images")
        .upload(req.file.filename, req.file.buffer, { contentType: req.file.mimetype })
    
    const capture = await Capture.create({ ...data, image: req.file.filename, espId: esp.id })
    res.send(capture.dataValues)
}

const patch: RequestHandler = async (req, res, next) => {
    const cid = req.params.cid as string
    if (!cid) return res.status(400).send("Capture id required.")

    const { data, error, success } = CaptureUpdateSchema.safeParse(req.body)
    if (!success) return res.status(400).send(error.issues.at(0)?.message)

    const capture = await Capture.findByPk(cid)
    if (!capture || !(await espService.owns(req.user, capture.espId))) return res.status(404).send("Capture not found.")

    await capture.update(data)
    res.send(capture.dataValues)
}

const destroy: RequestHandler = async (req, res, next) => {
    const cid = req.params.cid as string
    if (!cid) return res.status(400).send("Capture id required.")

    const capture = await Capture.findByPk(cid)
    if (!capture || !(await espService.owns(req.user, capture.espId))) return res.status(404).send("Capture not found.")

    await fs
        .unlink(`${process.cwd()}/${env.multer.path}/${capture.image}`)
        .catch(() => undefined)
    
    await supabaseService.supabase.storage
        .from("images")
        .remove([capture.image])
        
    await capture.destroy()
    return res.status(204).send("Capture deleted successfully.")
}

//

const serve: RequestHandler = async (req, res, next) => {
    const filename = req.params.filename as string
    if (!filename) return res.status(404).send("Capture image filename expected.")
    
    const path = `${process.cwd()}/${env.multer.path}/${filename}`
    let exists = await fs.access(path)
        .then(() => true)
        .catch(() => false)
    if (exists) return res.sendFile(path)

    const { data, error } = await supabaseService.supabase.storage
        .from("images")
        .download(filename)
    
    if (error) console.info(error.message)
    if (error) return res.status(404).send(`Capture image ${filename} not found.`)
    
    const buffer = await data.arrayBuffer()
    await fs.writeFile(path, Buffer.from(buffer))
    return res.sendFile(path)
}

//

export default { get, post, patch, destroy, serve }
