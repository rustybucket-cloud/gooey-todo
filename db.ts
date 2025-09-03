import { Database } from "bun:sqlite";

export type Todo = {
	id?: number
	text: string
	completedAt: string | null
	assignedDate: string | null
	createdAt: string
}

class TodoDatabase {
	private db: Database;

	constructor(dbPath: string = "todos.sqlite") {
		this.db = new Database(dbPath);
		this.initializeDatabase();
	}

	private initializeDatabase() {
		this.db.run(`
			CREATE TABLE IF NOT EXISTS todos (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				text TEXT NOT NULL,
				completedAt TEXT,
				assignedDate TEXT,
				createdAt TEXT NOT NULL
			)
		`);
	}

	getAllTodos(): Todo[] {
		const query = this.db.query("SELECT * FROM todos ORDER BY createdAt ASC");
		return query.all() as Todo[];
	}

	getTodosByDate(assignedDate: string): Todo[] {
		const query = this.db.query("SELECT * FROM todos WHERE assignedDate = ? ORDER BY createdAt ASC");
		return query.all(assignedDate) as Todo[];
	}

	addTodo(todo: Omit<Todo, 'id'>): Todo {
		const query = this.db.query(`
			INSERT INTO todos (text, completedAt, assignedDate, createdAt)
			VALUES (?, ?, ?, ?)
			RETURNING *
		`);
		
		const result = query.get(todo.text, todo.completedAt, todo.assignedDate, todo.createdAt) as Todo;
		return result;
	}

	updateTodo(id: number, updates: Partial<Omit<Todo, 'id'>>): Todo | null {
		const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
		const values = Object.values(updates);
		
		if (fields.length === 0) return null;
		
		const query = this.db.query(`
			UPDATE todos SET ${fields} WHERE id = ?
			RETURNING *
		`);
		
		const result = query.get(...values, id) as Todo;
		return result;
	}

	deleteTodo(id: number): boolean {
		const query = this.db.query("DELETE FROM todos WHERE id = ?");
		const result = query.run(id);
		return result.changes > 0;
	}

	toggleComplete(id: number): Todo | null {
		const todo = this.db.query("SELECT * FROM todos WHERE id = ?").get(id) as Todo;
		if (!todo) return null;

		const newCompletedAt = todo.completedAt ? null : new Date().toISOString();
		return this.updateTodo(id, { completedAt: newCompletedAt });
	}

	close() {
		this.db.close();
	}
}

export const todoDb = new TodoDatabase();