import { Capture } from "@/models/capture.model.js"
import { Detection } from "@/models/detection.model.js"
import { PixelToCmRatio, PlantHeight } from "@/modules/plant/model.js"
import type { CreatePixelToCmRatioBody, ListPlantHeightsQuery, PlantDetection } from "@/modules/plant/schema.js"
import { Op } from "sequelize"

//

type CreatePlantCaptureInput = {
	image: string
	detections: PlantDetection[]
	frameWidth: number
	frameHeight: number
}

//

const createPlantCapture = async (input: CreatePlantCaptureInput) => {
	const sequelize = Capture.sequelize
	if (!sequelize) throw new Error("Database is not initialized.")

	return await sequelize.transaction(async transaction => {
		const capture = await Capture.create({ image: input.image, object: "plant" }, { transaction })
		const detections: Detection[] = []
		const heights: PlantHeight[] = []

		for (const data of input.detections) {
			const detection = await Detection.create({ ...data, captureId: capture.id }, { transaction })
			const height = await PlantHeight.create(
				{
					captureId: capture.id,
					detectionId: detection.id,
					box: data.box,
					frameWidth: input.frameWidth,
					frameHeight: input.frameHeight,
					pixelHeight: Number((data.box.h * input.frameHeight).toFixed(4)),
					heightPercent: Number((data.box.h * 100).toFixed(4)),
				},
				{ transaction }
			)

			detections.push(detection)
			heights.push(height)
		}

		return {
			capture: capture.toJSON(),
			detections: detections.map(detection => detection.toJSON()),
			heights: heights.map(height => height.toJSON()),
		}
	})
}

const listPlantHeights = async (query: ListPlantHeightsQuery) => {
	const createdAt = {
		...(query.alpha && { [Op.gte]: query.alpha }),
		...(query.omega && { [Op.lte]: query.omega }),
	}

	const heights = await PlantHeight.findAll({
		...(Object.keys(createdAt).length && { where: { createdAt } }),
		limit: query.limit,
		offset: query.offset,
		order: [["createdAt", "DESC"]],
		raw: true,
	})

	return heights.reverse()
}

const listPixelToCmRatios = async () => {
	return await PixelToCmRatio.findAll({ order: [["createdAt", "DESC"]], raw: true })
}

const createPixelToCmRatio = async (input: CreatePixelToCmRatioBody) => {
	return await PixelToCmRatio.create({
		...input,
		centimetersPerPixel: Number((input.centimeters / input.pixels).toFixed(10)),
	})
}

//

export { createPixelToCmRatio, createPlantCapture, listPixelToCmRatios, listPlantHeights }
