import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getTodosByDate, addTodo, updateTodo, deleteTodo, toggleComplete, type Todo, type InsertTodo } from "../../../services/todos";

interface DayTodosContextType {
	todos: Todo[];
	addTodo: (text: string) => void;
	updateTodoById: (id: number, updates: Partial<Omit<Todo, 'id'>>) => void;
	deleteTodoById: (id: number) => void;
	toggleTodoComplete: (id: number) => void;
	refreshTodos: (date: string) => void;
}

const DayTodosContext = createContext<DayTodosContextType>({
	todos: [],
	addTodo: () => {},
	updateTodoById: () => {},
	deleteTodoById: () => {},
	toggleTodoComplete: () => {},
	refreshTodos: () => {},
});

export const useDayTodos = () => {
	const context = useContext(DayTodosContext);
	if (!context) {
		throw new Error('useDayTodos must be used within a DayTodosProvider');
	}
	return context;
};

interface DayTodosProviderProps {
	children: ReactNode;
	date: string;
}

export default function DayTodosProvider({ children, date }: DayTodosProviderProps) {
	const [todos, setTodos] = useState<Todo[]>([]);

	const refreshTodos = useCallback((dateString: string) => {
		const dayTodos = getTodosByDate(dateString);
		setTodos(dayTodos);
	}, []);

	const addTodoForDay = useCallback((text: string) => {
		const newTodo: InsertTodo = {
			text,
			completedAt: null,
			assignedDate: date,
			createdAt: new Date().toISOString()
		};

		const addedTodo = addTodo(newTodo);
		setTodos(prev => [...prev, addedTodo]);
	}, [date]);

	const updateTodoById = useCallback((id: number, updates: Partial<Omit<Todo, 'id'>>) => {
		const updatedTodo = updateTodo(id, updates);
		if (!updatedTodo) return;

		setTodos(prev => prev.map(todo => todo.id === id ? updatedTodo : todo));
	}, []);

	const deleteTodoById = useCallback((id: number) => {
		const success = deleteTodo(id);
		if (!success) return;

		setTodos(prev => prev.filter(todo => todo.id !== id));
	}, []);

	const toggleTodoComplete = useCallback((id: number) => {
		const updatedTodo = toggleComplete(id);
		if (!updatedTodo) return;

		setTodos(prev => prev.map(todo => todo.id === id ? updatedTodo : todo));
	}, []);

	// Load todos when date changes
	useEffect(() => {
		refreshTodos(date);
	}, [date, refreshTodos]);

	const value: DayTodosContextType = {
		todos,
		addTodo: addTodoForDay,
		updateTodoById,
		deleteTodoById,
		toggleTodoComplete,
		refreshTodos
	};

	return (
		<DayTodosContext.Provider value={value}>
			{children}
		</DayTodosContext.Provider>
	);
}