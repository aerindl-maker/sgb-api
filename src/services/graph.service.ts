// --- Select evenly spaced records in chronological order, including the latest.
const sampleGraphRows = <T>(rows: T[], limit = 50): T[] => {
	if (rows.length <= limit) return rows
	return Array.from({ length: limit }, (_, index) => rows[Math.ceil(((index + 1) * rows.length) / limit) - 1]!)
}

//

export { sampleGraphRows }
