import { Model, DataTypes, Sequelize, ModelAttributes } from "sequelize"
import type {
    InitOptions,
    InferAttributes,
    CreationOptional,
    InferCreationAttributes,
    ForeignKey,
} from "sequelize"

//

class Threshold extends Model<InferAttributes<Threshold>, InferCreationAttributes<Threshold>> {
    declare id: CreationOptional<number>
    declare icon: string
    declare value: number
    declare reading: string
    declare message: string
    declare operator: string
    declare espId: ForeignKey<number | null>
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
}

//

const thresholdAttr: ModelAttributes<Threshold, InferAttributes<Threshold>> = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    icon: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    reading: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    operator: {
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

const thresholdOpts = (sequelize: Sequelize): InitOptions<Threshold> => ({
    sequelize,
    tableName: "thresholds",
    timestamps: true,
})

//

export { Threshold, thresholdAttr, thresholdOpts }
