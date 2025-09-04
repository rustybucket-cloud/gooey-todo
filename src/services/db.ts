import { Database } from "bun:sqlite"

const db = new Database("todos.sqlite");

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
