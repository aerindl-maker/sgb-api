import { Model, DataTypes, Sequelize, ModelAttributes } from "sequelize"
import type {
    InitOptions,
    InferAttributes,
    CreationOptional,
    InferCreationAttributes,
    ForeignKey,
} from "sequelize"

//

class Esp extends Model<InferAttributes<Esp>, InferCreationAttributes<Esp>> {
    declare id: CreationOptional<number>
    declare name: string
    declare keyHash: CreationOptional<string | null>
    declare enabled: CreationOptional<boolean>
    declare lastSeenAt: CreationOptional<Date | null>
    declare userId: ForeignKey<number | null>
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
}

//

const espAttr: ModelAttributes<Esp, InferAttributes<Esp>> = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    keyHash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: "esps_key_hash",
    },
    enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    lastSeenAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    // --- Nullable only so existing esps can be adopted on boot
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { key: "id", model: "users" },
        onDelete: "SET NULL",
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

const espOpts = (sequelize: Sequelize): InitOptions<Esp> => ({
    sequelize,
    tableName: "esps",
    timestamps: true,
})

//

export { Esp, espAttr, espOpts }
