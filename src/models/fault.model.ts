import { Model, DataTypes, Sequelize, ModelAttributes } from "sequelize"
import type { InitOptions, InferAttributes, CreationOptional, InferCreationAttributes, ForeignKey } from "sequelize"

//

class Fault extends Model<InferAttributes<Fault>, InferCreationAttributes<Fault>> {
	declare id: CreationOptional<number>
	declare title: string
	declare message: string
	declare espId: ForeignKey<number | null>
	declare createdAt: CreationOptional<Date>
	declare updatedAt: CreationOptional<Date>
}

//

const faultAttr: ModelAttributes<Fault, InferAttributes<Fault>> = {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	title: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	message: {
		type: DataTypes.STRING,
		allowNull: false,
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

const faultOpts = (sequelize: Sequelize): InitOptions<Fault> => ({
	sequelize,
	tableName: "faults",
	timestamps: true,
})

//

export { Fault, faultAttr, faultOpts }
