import db from "./db";

export type Todo = {
	id: number
	text: string
	completedAt: string | null
	assignedDate: string | null
	createdAt: string
}

export type InsertTodo = Omit<Todo, 'id'>

export function getTodosByDate(assignedDate: string): Todo[] {
	const query = db.query("SELECT * FROM todos WHERE assignedDate = ? ORDER BY createdAt ASC");
	return query.all(assignedDate) as Todo[];
}

export function addTodo(todo: InsertTodo) {
	const query = db.query(`
		INSERT INTO todos (text, completedAt, assignedDate, createdAt)
		VALUES (?, ?, ?, ?)
		RETURNING *
	`);
	
	const result = query.get(todo.text, todo.completedAt, todo.assignedDate, todo.createdAt) as Todo;
	return result;
}

export function updateTodo(id: number, updates: Partial<Omit<Todo, 'id'>>): Todo | null {
	const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
	const values = Object.values(updates);
	
	if (fields.length === 0) return null;
	
	const query = db.query(`
		UPDATE todos SET ${fields} WHERE id = ?
		RETURNING *
	`);
	
	const result = query.get(...values, id) as Todo;
	return result;
}

export function deleteTodo(id: number): boolean {
	const query = db.query("DELETE FROM todos WHERE id = ?");
	const result = query.run(id);
	return result.changes > 0;
}

export function toggleComplete(id: number): Todo | null {
	const todo = db.query("SELECT * FROM todos WHERE id = ?").get(id) as Todo;
	if (!todo) return null;

	const newCompletedAt = todo.completedAt ? null : new Date().toISOString();
	return updateTodo(id, { completedAt: newCompletedAt });
}

