import { Database } from "bun:sqlite"
import { join } from "path"
import { existsSync, mkdirSync } from "fs"

function getDatabasePath(): string {
	if (process.env.NODE_ENV === "development") {
		return "todos.sqlite"
	}
	
	const platform = process.platform
	let appDataDir: string
	
	if (platform === "win32") {
		appDataDir = process.env.APPDATA || join(process.env.USERPROFILE || "", "AppData", "Roaming")
	} else if (platform === "darwin") {
		appDataDir = join(process.env.HOME || "", "Library", "Application Support")
	} else {
		appDataDir = process.env.XDG_DATA_HOME || join(process.env.HOME || "", ".local", "share")
	}
	
	const todoAppDir = join(appDataDir, "TodoUI")
	
	if (!existsSync(todoAppDir)) {
		mkdirSync(todoAppDir, { recursive: true })
	}
	
	return join(todoAppDir, "todos.sqlite")
}

const db = new Database(getDatabasePath());

db.run(`
	CREATE TABLE IF NOT EXISTS todos (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		text TEXT NOT NULL,
		completedAt TEXT,
		assignedDate TEXT,
		createdAt TEXT NOT NULL
	)
`)

export default db
