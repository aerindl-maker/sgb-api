import type { RequestHandler } from "express"
import type { ZodType } from "zod"

//

type ValidationTarget = "body" | "params" | "query"

//

const validate =
	(target: ValidationTarget, schema: ZodType): RequestHandler =>
	(req, res, next) => {
		const result = schema.safeParse(req[target])
		if (!result.success) {
			res.status(400).json({
				error: {
					code: "VALIDATION_ERROR",
					message: "Request data is invalid.",
					details: result.error.flatten(),
				},
			})
			return
		}

		req.validated ??= {}
		req.validated[target] = result.data
		next()
	}

const validateBody = (schema: ZodType) => validate("body", schema)
const validateParams = (schema: ZodType) => validate("params", schema)
const validateQuery = (schema: ZodType) => validate("query", schema)

//

export { validateBody, validateParams, validateQuery }
