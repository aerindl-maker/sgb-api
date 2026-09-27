import { Model, DataTypes, Sequelize, ModelAttributes } from "sequelize"
import type {
    InitOptions,
    InferAttributes,
    CreationOptional,
    InferCreationAttributes,
    ForeignKey,
} from "sequelize"

//

class Capture extends Model<InferAttributes<Capture>, InferCreationAttributes<Capture>> {
    declare id: CreationOptional<number>
    declare image: string
    declare object: string
    declare espId: ForeignKey<number | null>
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
}

//

const captureAttr: ModelAttributes<Capture, InferAttributes<Capture>> = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    object: {
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

const captureOpts = (sequelize: Sequelize): InitOptions<Capture> => ({
    sequelize,
    tableName: "captures",
    timestamps: true,
})

//

export { Capture, captureAttr, captureOpts }
