import { Model, DataTypes, Sequelize, ModelAttributes } from "sequelize"
import type {
    InitOptions,
    InferAttributes,
    CreationOptional,
    InferCreationAttributes,
} from "sequelize"

//

class PasswordReset extends Model<InferAttributes<PasswordReset>, InferCreationAttributes<PasswordReset>> {
    declare id: CreationOptional<number>
    declare userId: number
    declare code: string
    declare attempts: CreationOptional<number>
    declare expiresAt: Date
    declare createdAt: CreationOptional<Date>
    declare updatedAt: CreationOptional<Date>
}

//

const passwordResetAttr: ModelAttributes<PasswordReset, InferAttributes<PasswordReset>> = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: "userId",
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    expiresAt: {
        type: DataTypes.DATE,
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

const passwordResetOpts = (sequelize: Sequelize): InitOptions<PasswordReset> => ({
    sequelize,
    tableName: "password_resets",
    timestamps: true,
})

//

export { PasswordReset, passwordResetAttr, passwordResetOpts }
