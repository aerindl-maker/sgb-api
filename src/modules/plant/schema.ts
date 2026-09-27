import z from "zod"
import { DEFAULT_ESP_ID } from "@/schemas/esp.schema.js"

//

const parseJson = (value: unknown) => {
	if (typeof value !== "string") return value

	try {
		return JSON.parse(value)
	} catch {
		return value
	}
}

// --- Legacy clients omit the esp and mean the default one
const espIdSchema = z.coerce.number().int().positive().default(DEFAULT_ESP_ID)

//

const plantBoundingBoxSchema = z
	.object({
		x: z.coerce.number().finite().min(0).max(1),
		y: z.coerce.number().finite().min(0).max(1),
		w: z.coerce.number().finite().positive().max(1),
		h: z.coerce.number().finite().positive().max(1),
	})
	.strict()
	.refine(box => box.x + box.w <= 1.000001 && box.y + box.h <= 1.000001, {
		message: "Bounding box must remain within the captured frame.",
	})

const plantDetectionSchema = z
	.object({
		box: plantBoundingBoxSchema,
		class: z.literal("plant"),
		confidence: z.coerce.number().finite().min(0).max(1),
	})
	.strict()

const createPlantCaptureBodySchema = z
	.object({
		detections: z.preprocess(parseJson, z.array(plantDetectionSchema).min(1).max(100)),
		frameWidth: z.coerce.number().int().positive().max(8192),
		frameHeight: z.coerce.number().int().positive().max(8192),
		espId: espIdSchema,
	})
	.strict()

const listPlantHeightsQuerySchema = z
	.object({
		alpha: z.coerce.date().optional(),
		omega: z.coerce.date().optional(),
		limit: z.coerce.number().int().min(1).max(500).default(100),
		offset: z.coerce.number().int().min(0).default(0),
		order: z.enum(["asc", "desc"]).optional(),
		espId: espIdSchema,
	})
	.strict()

const countPlantHeightsQuerySchema = z
	.object({
		alpha: z.coerce.date().optional(),
		omega: z.coerce.date().optional(),
		espId: espIdSchema,
	})
	.strict()

const createPixelToCmRatioBodySchema = z
	.object({
		pixels: z.coerce.number().finite().positive(),
		centimeters: z.coerce.number().finite().positive(),
	})
	.strict()

//

type PlantDetection = z.infer<typeof plantDetectionSchema>
type CreatePlantCaptureBody = z.infer<typeof createPlantCaptureBodySchema>
type ListPlantHeightsQuery = z.infer<typeof listPlantHeightsQuerySchema>
type CountPlantHeightsQuery = z.infer<typeof countPlantHeightsQuerySchema>
type CreatePixelToCmRatioBody = z.infer<typeof createPixelToCmRatioBodySchema>

//

export {
	countPlantHeightsQuerySchema,
	createPixelToCmRatioBodySchema,
	createPlantCaptureBodySchema,
	listPlantHeightsQuerySchema,
	plantBoundingBoxSchema,
	plantDetectionSchema,
}
export type {
	CountPlantHeightsQuery,
	CreatePixelToCmRatioBody,
	CreatePlantCaptureBody,
	ListPlantHeightsQuery,
	PlantDetection,
}
