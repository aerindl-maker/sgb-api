import type { UserSafeSchema } from "@/schemas/user.schema.js"

//

declare global {
	namespace Express {
		interface Request {
			user?: UserSafeSchema
			validated?: {
				body?: unknown
				params?: unknown
				query?: unknown
			}
		}
	}
}

//

export {}
