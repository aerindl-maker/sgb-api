import { DataTypes, Model } from "sequelize"
import type {
	CreationOptional,
	ForeignKey,
	InferAttributes,
	InferCreationAttributes,
	InitOptions,
	ModelAttributes,
	Sequelize,
} from "sequelize"

//

type PlantBoundingBox = {
	x: number
	y: number
	w: number
	h: number
}

//

class PlantHeight extends Model<InferAttributes<PlantHeight>, InferCreationAttributes<PlantHeight>> {
	declare id: CreationOptional<number>
	declare captureId: ForeignKey<number>
	declare detectionId: ForeignKey<number>
	declare box: PlantBoundingBox
	declare frameWidth: number
	declare frameHeight: number
	declare pixelHeight: number
	declare heightPercent: number
	declare createdAt: CreationOptional<Date>
	declare updatedAt: CreationOptional<Date>
}

class PixelToCmRatio extends Model<InferAttributes<PixelToCmRatio>, InferCreationAttributes<PixelToCmRatio>> {
	declare id: CreationOptional<number>
	declare pixels: number
	declare centimeters: number
	declare centimetersPerPixel: number
	declare createdAt: CreationOptional<Date>
	declare updatedAt: CreationOptional<Date>
}

//

const plantHeightAttr: ModelAttributes<PlantHeight, InferAttributes<PlantHeight>> = {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	captureId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: { key: "id", model: "captures" },
	},
	detectionId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		unique: true,
		references: { key: "id", model: "detections" },
	},
	box: {
		type: DataTypes.JSON,
		allowNull: false,
	},
	frameWidth: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	frameHeight: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	pixelHeight: {
		type: DataTypes.DECIMAL(12, 4),
		allowNull: false,
	},
	heightPercent: {
		type: DataTypes.DECIMAL(7, 4),
		allowNull: false,
	},
	createdAt: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW,
	},
	updatedAt: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW,
	},
}

const pixelToCmRatioAttr: ModelAttributes<PixelToCmRatio, InferAttributes<PixelToCmRatio>> = {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	pixels: {
		type: DataTypes.DECIMAL(12, 4),
		allowNull: false,
	},
	centimeters: {
		type: DataTypes.DECIMAL(12, 4),
		allowNull: false,
	},
	centimetersPerPixel: {
		type: DataTypes.DECIMAL(18, 10),
		allowNull: false,
	},
	createdAt: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW,
	},
	updatedAt: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW,
	},
}

//

const plantHeightOpts = (sequelize: Sequelize): InitOptions<PlantHeight> => ({
	sequelize,
	tableName: "plant_heights",
	timestamps: true,
})

const pixelToCmRatioOpts = (sequelize: Sequelize): InitOptions<PixelToCmRatio> => ({
	sequelize,
	tableName: "pixel_to_cm_ratios",
	timestamps: true,
})

//

export { PixelToCmRatio, PlantHeight, pixelToCmRatioAttr, pixelToCmRatioOpts, plantHeightAttr, plantHeightOpts }
export type { PlantBoundingBox }
