import env from "@/config/env.config.js"
import { Options, Sequelize } from "sequelize"
import { Capture, captureAttr, captureOpts } from "@/models/capture.model.js"
import { Detection, detectionAttr, detectionOpts } from "@/models/detection.model.js"
import { Reading, readingAttr, readingOpts } from "@/models/reading.model.js"
import { Settings, settingsAttr, settingsOpts } from "@/models/settings.model.js"
import { Threshold, thresholdAttr, thresholdOpts } from "@/models/threshold.model.js"
import { User, userAttr, userOpts } from "@/models/user.model.js"
import { Device, deviceAttr, deviceOpts } from "@/models/device.model.js"
import { Fault, faultAttr, faultOpts } from "@/models/fault.model.js"
import {
	PixelToCmRatio,
	PlantHeight,
	pixelToCmRatioAttr,
	pixelToCmRatioOpts,
	plantHeightAttr,
	plantHeightOpts,
} from "@/modules/plant/model.js"

//

const boot = async () => {
	const { user, pass, host, port, log, name, dialect, certificate } = env.database
	const url = `${dialect}://${user}:${pass}@${host}:${port}`

	const rawsqlize = new Sequelize(url, { logging: log && console.log })
	await rawsqlize.query(`CREATE DATABASE IF NOT EXISTS \`${name}\`;`)
	console.info("Database connected and checked.")

	const options: Options = { ...(!!certificate && { dialectOptions: { ssl: { ca: certificate } } }) }
	const sequelize = new Sequelize(`${url}/${name}`, { ...options, logging: log && console.log })

	Capture.init(captureAttr, captureOpts(sequelize))
	Detection.init(detectionAttr, detectionOpts(sequelize))
	Device.init(deviceAttr, deviceOpts(sequelize))
	Fault.init(faultAttr, faultOpts(sequelize))
	PixelToCmRatio.init(pixelToCmRatioAttr, pixelToCmRatioOpts(sequelize))
	PlantHeight.init(plantHeightAttr, plantHeightOpts(sequelize))
	Reading.init(readingAttr, readingOpts(sequelize))
	Settings.init(settingsAttr, settingsOpts(sequelize))
	Threshold.init(thresholdAttr, thresholdOpts(sequelize))
	User.init(userAttr, userOpts(sequelize))

	User.hasMany(Device, { foreignKey: "userId", onDelete: "CASCADE" })
	Capture.hasMany(Detection, { foreignKey: "captureId", onDelete: "CASCADE" })
	Capture.hasMany(PlantHeight, { as: "plantHeights", foreignKey: "captureId", onDelete: "CASCADE" })
	Detection.belongsTo(Capture, { as: "capture", foreignKey: "captureId" })
	Detection.hasOne(PlantHeight, { as: "plantHeight", foreignKey: "detectionId", onDelete: "CASCADE" })
	PlantHeight.belongsTo(Capture, { as: "capture", foreignKey: "captureId" })
	PlantHeight.belongsTo(Detection, { as: "detection", foreignKey: "detectionId" })
	Device.belongsTo(User, { as: "user", foreignKey: "userId" })

	await sequelize.authenticate()
	const { sync, alter, force } = env.database
	if (sync) await sequelize.sync({ alter, force })
	console.info(`[Boot.Sequelize]: ${sync ? `Synced` : `Connected`} successfully.`)
}

//

export default { boot }
