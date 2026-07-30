import multerMiddleware from "@/middlewares/multer.middleware.js"
import {
	createPixelToCmRatio,
	createPlantCapture,
	listPixelToCmRatios,
	listPlantHeights,
} from "@/modules/plant/repository.js"
import type { CreatePixelToCmRatioBody, CreatePlantCaptureBody, ListPlantHeightsQuery } from "@/modules/plant/schema.js"
import supabaseService from "@/services/supabase.service.js"
import type { RequestHandler } from "express"

//

const listHeightsController: RequestHandler = async (req, res) => {
	const query = req.validated?.query as ListPlantHeightsQuery
	const heights = await listPlantHeights(query)
	res.status(200).json(heights)
}

const listPixelToCmRatiosController: RequestHandler = async (_, res) => {
	const ratios = await listPixelToCmRatios()
	res.status(200).json(ratios)
}

const createPixelToCmRatioController: RequestHandler = async (req, res) => {
	const body = req.validated?.body as CreatePixelToCmRatioBody
	const ratio = await createPixelToCmRatio(body)
	res.status(201).json(ratio.toJSON())
}

const createPlantCaptureController: RequestHandler = async (req, res, next) => {
	if (!req.file) {
		res.status(400).json({ error: { code: "IMAGE_REQUIRED", message: "A captured image is required." } })
		return
	}

	const body = req.validated?.body as CreatePlantCaptureBody
	const filename = multerMiddleware.buildImageFilename(req.file.originalname)
	const bucket = supabaseService.supabase.storage.from("images")
	const { error } = await bucket.upload(filename, req.file.buffer, { contentType: req.file.mimetype })

	if (error) {
		res.status(502).json({
			error: { code: "IMAGE_UPLOAD_FAILED", message: "The captured image could not be saved." },
		})
		return
	}

	try {
		const result = await createPlantCapture({ image: filename, ...body })
		res.status(201).json(result)
	} catch (error) {
		await bucket.remove([filename])
		next(error)
	}
}

//

export {
	createPixelToCmRatioController,
	createPlantCaptureController,
	listHeightsController,
	listPixelToCmRatiosController,
}
