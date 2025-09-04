import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getTodosByDate, addTodo, updateTodo, deleteTodo, toggleComplete, type Todo, type InsertTodo } from "../../../services/todos";

type TodosByDay = Record<string, Todo[]>;

interface TodosContextType {
	todosByDay: TodosByDay;
	addTodoForDate: (date: string, text: string) => void;
	updateTodoById: (id: number, updates: Partial<Omit<Todo, 'id'>>) => void;
	deleteTodoById: (id: number) => void;
	toggleTodoComplete: (id: number) => void;
	refreshTodosForWeek: (weekStart: Date, weekEnd: Date) => void;
}

const TodosContext = createContext<TodosContextType>({
	todosByDay: {},
	addTodoForDate: () => {},
	updateTodoById: () => {},
	deleteTodoById: () => {},
	toggleTodoComplete: () => {},
	refreshTodosForWeek: () => {},
});

export const useTodos = () => {
	const context = useContext(TodosContext);
	if (!context) {
		throw new Error('useTodos must be used within a TodosProvider');
	}
	return context;
};

interface TodosProviderProps {
	children: ReactNode;
	weekStart: Date;
	weekEnd: Date;
}

export default function TodosProvider({ children, weekStart, weekEnd }: TodosProviderProps) {
	const [todosByDay, setTodosByDay] = useState<TodosByDay>({});

	const formatDate = useCallback((date: Date): string => {
		return date.toISOString().split('T')[0]!;
	}, []);

	const getDaysInWeek = useCallback((start: Date, end: Date): string[] => {
		const days: string[] = [];
		const current = new Date(start);
		
		while (current <= end) {
			days.push(formatDate(current));
			current.setDate(current.getDate() + 1);
		}
		
		return days;
	}, [formatDate]);

	const refreshTodosForWeek = useCallback((weekStart: Date, weekEnd: Date) => {
		const days = getDaysInWeek(weekStart, weekEnd);
		days.push("someday");
		const newTodosByDay: TodosByDay = {};

		days.forEach(date => {
			newTodosByDay[date] = getTodosByDate(date);
		});

		setTodosByDay(newTodosByDay);
	}, [getDaysInWeek]);

	const addTodoForDate = useCallback((date: string, text: string) => {
		const newTodo: InsertTodo = {
			text,
			completedAt: null,
			assignedDate: date,
			createdAt: new Date().toISOString()
		};

		const addedTodo = addTodo(newTodo);
		
		setTodosByDay(prev => ({
			...prev,
			[date]: [...(prev[date] || []), addedTodo]
		}));
	}, []);

	const updateTodoById = useCallback((id: number, updates: Partial<Omit<Todo, 'id'>>) => {
		const updatedTodo = updateTodo(id, updates);
		if (!updatedTodo) return;

		setTodosByDay(prev => {
			const newTodosByDay = { ...prev };
			
			// Find and update the todo in the appropriate day
			Object.keys(newTodosByDay).forEach(date => {
				const todoIndex = newTodosByDay[date]?.findIndex(todo => todo.id === id);
				if (todoIndex !== undefined && todoIndex !== -1) {
					newTodosByDay[date] = [...newTodosByDay[date]!];
					newTodosByDay[date]![todoIndex] = updatedTodo;
				}
			});
			
			return newTodosByDay;
		});
	}, []);

	const deleteTodoById = useCallback((id: number) => {
		const success = deleteTodo(id);
		if (!success) return;

		setTodosByDay(prev => {
			const newTodosByDay = { ...prev };
			
			// Find and remove the todo from the appropriate day
			Object.keys(newTodosByDay).forEach(date => {
				if (newTodosByDay[date]) {
					newTodosByDay[date] = newTodosByDay[date]!.filter(todo => todo.id !== id);
				}
			});
			
			return newTodosByDay;
		});
	}, []);

	const toggleTodoComplete = useCallback((id: number) => {
		const updatedTodo = toggleComplete(id);
		if (!updatedTodo) return;

		setTodosByDay(prev => {
			const newTodosByDay = { ...prev };
			
			// Find and update the todo in the appropriate day
			Object.keys(newTodosByDay).forEach(date => {
				const todoIndex = newTodosByDay[date]?.findIndex(todo => todo.id === id);
				if (todoIndex !== undefined && todoIndex !== -1) {
					newTodosByDay[date] = [...newTodosByDay[date]!];
					newTodosByDay[date]![todoIndex] = updatedTodo;
				}
			});
			
			return newTodosByDay;
		});
	}, []);

	// Load todos when week range changes
	useEffect(() => {
		refreshTodosForWeek(weekStart, weekEnd);
	}, [weekStart, weekEnd, refreshTodosForWeek]);

	const value: TodosContextType = {
		todosByDay,
		addTodoForDate,
		updateTodoById,
		deleteTodoById,
		toggleTodoComplete,
		refreshTodosForWeek
	};

	return (
		<TodosContext.Provider value={value}>
			{children}
		</TodosContext.Provider>
	);
}