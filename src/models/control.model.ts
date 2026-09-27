import { Model, DataTypes, Sequelize, ModelAttributes } from "sequelize"
import type {
	InitOptions,
	InferAttributes,
	CreationOptional,
	InferCreationAttributes,
	ForeignKey,
} from "sequelize"

//

class Control extends Model<InferAttributes<Control>, InferCreationAttributes<Control>> {
	declare id: CreationOptional<number>
	declare automation: CreationOptional<boolean>
	declare pump: CreationOptional<boolean>
	declare intake: CreationOptional<boolean>
	declare exhaust: CreationOptional<boolean>
	declare light: CreationOptional<boolean>
	declare espId: ForeignKey<number | null>
	declare createdAt: CreationOptional<Date>
	declare updatedAt: CreationOptional<Date>
}

//

const controlAttr: ModelAttributes<Control, InferAttributes<Control>> = {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	automation: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: true,
	},
	pump: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	},
	intake: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	},
	exhaust: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	},
	light: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	},
	espId: {
		type: DataTypes.INTEGER,
		allowNull: true,
		references: { key: "id", model: "esps" },
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

const controlOpts = (sequelize: Sequelize): InitOptions<Control> => ({
	sequelize,
	tableName: "controls",
	timestamps: true,
	// --- One control row per esp, declared here so alter adds it to existing tables
	indexes: [{ name: "controls_esp_id", unique: true, fields: ["espId"] }],
})

//

export { Control, controlAttr, controlOpts }
