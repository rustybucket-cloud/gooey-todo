import { useState, useReducer } from 'react'
import { render, useKeyboard, useRenderer } from '@opentui/react'
import { strikethrough } from '@opentui/core'

type Todo = {
	text: string
	completedAt: string | null
	assignedDate: string | null
	createdAt: string
}

const { currentWeekday, weekStart, weekEnd } = getCurrentWeek()

const dates = {
	sunday: weekStart.toISOString().substring(0, 10),
	monday: addDays(weekStart, 1).toISOString().substring(0, 10),
	tuesday: addDays(weekStart, 2).toISOString().substring(0, 10),
	wednesday: addDays(weekStart, 3).toISOString().substring(0, 10),
	thursday: addDays(weekStart, 4).toISOString().substring(0, 10),
	friday: addDays(weekStart, 5).toISOString().substring(0, 10),
	saturday: addDays(weekStart, 6).toISOString().substring(0, 10),
}

type Weekday = (typeof dates)[keyof typeof dates]

const dateIndicies = {
	[dates.sunday]: 0,
	[dates.monday]: 1,
	[dates.tuesday]: 2,
	[dates.wednesday]: 3,
	[dates.thursday]: 4,
	[dates.friday]: 5,
	[dates.saturday]: 6,
}

const datesByIndex = {
	0: dates.sunday,
	1: dates.monday,
	2: dates.tuesday,
	3: dates.wednesday,
	4: dates.thursday,
	5: dates.friday,
	6: dates.saturday,
}

type TodosByDay = {
	[dates.monday]: Todo[]
	[dates.tuesday]: Todo[]
	[dates.wednesday]: Todo[]
	[dates.thursday]: Todo[]
	[dates.friday]: Todo[]
	[dates.saturday]: Todo[]
	[dates.sunday]: Todo[]
}

type Focus = {
	date: number
	row: number
}

type ACTIONS = 'MOVE_DOWN' | 'MOVE_UP' | 'MOVE_RIGHT' | 'MOVE_LEFT'

function reducer(state: Focus, action: { type: ACTIONS; todos?: TodosByDay }) {
	const todosByDay: TodosByDay = action.todos || {
		[dates.monday]: [],
		[dates.tuesday]: [],
		[dates.wednesday]: [],
		[dates.thursday]: [],
		[dates.friday]: [],
		[dates.saturday]: [],
		[dates.sunday]: [],
	}
	const currentDateString = datesByIndex[state.date as keyof typeof datesByIndex]
	const currentTodos = todosByDay[currentDateString] || []
	
	switch (action.type) {
		case 'MOVE_DOWN':
			if (state.row >= currentTodos.length) return state
			return { ...state, row: state.row + 1 }
		case 'MOVE_UP':
			if (state.row === 0) return state
			return { ...state, row: state.row - 1 }
		case 'MOVE_RIGHT':
			if (state.date === 6) return state // Saturday is index 6
			const nextDateString = datesByIndex[(state.date + 1) as keyof typeof datesByIndex]
			const nextTodos = todosByDay[nextDateString] || []
			const maxRow = Math.max(0, nextTodos.length)
			return { 
				...state, 
				date: state.date + 1,
				row: Math.min(state.row, maxRow)
			}
		case 'MOVE_LEFT':
			if (state.date === 0) return state // Sunday is index 0
			const prevDateString = datesByIndex[(state.date - 1) as keyof typeof datesByIndex]
			const prevTodos = todosByDay[prevDateString] || []
			const maxPrevRow = Math.max(0, prevTodos.length)
			return { 
				...state, 
				date: state.date - 1,
				row: Math.min(state.row, maxPrevRow)
			}
		default:
			return state
	}
}

function App() {
	const [todos, setTodos] = useState<Todo[]>([])

	const [focused, dispatch] = useReducer(reducer, { date: dateIndicies[dates.monday] || 1, row: 0 })

	const isInputFocused = focused.row === 0

	const renderer = useRenderer()

	const todosByDay: TodosByDay = {
		[dates.sunday]: todos.filter((todo) => todo.assignedDate === dates.sunday),
		[dates.monday]: todos.filter((todo) => todo.assignedDate === dates.monday),
		[dates.tuesday]: todos.filter((todo) => todo.assignedDate === dates.tuesday),
		[dates.wednesday]: todos.filter((todo) => todo.assignedDate === dates.wednesday),
		[dates.thursday]: todos.filter((todo) => todo.assignedDate === dates.thursday),
		[dates.friday]: todos.filter((todo) => todo.assignedDate === dates.friday),
		[dates.saturday]: todos.filter((todo) => todo.assignedDate === dates.saturday),
	}

	useKeyboard((key) => {
		if (['down', 'j'].includes(key.name)) {
			if (key.name === 'j' && isInputFocused) return
			dispatch({ type: 'MOVE_DOWN', todos: todosByDay })
		} else if (['up', 'k'].includes(key.name)) {
			if (key.name === 'k' && isInputFocused) return
			dispatch({ type: 'MOVE_UP', todos: todosByDay })
		}

		if (['right', 'l'].includes(key.name)) {
			if (key.name === 'l' && isInputFocused) return
			dispatch({ type: 'MOVE_RIGHT', todos: todosByDay })
		}

		if (['left', 'h'].includes(key.name)) {
			if (key.name === 'h' && isInputFocused) return
			dispatch({ type: 'MOVE_LEFT', todos: todosByDay })
		}

		if (isInputFocused) return

		if (key.name === 't') {
			renderer.toggleDebugOverlay()
		}

		if (key.name === 'c') {
			setTodos((prev) => {
				return prev.map((todo) => {
					if (!todo.assignedDate) return todo
					const isFocusedDate = dateIndicies[todo.assignedDate] === focused.date
					const row = (todosByDay[todo.assignedDate]?.findIndex((item) => item.text === todo.text) ?? 0) + 1
					if (isFocusedDate && row === focused.row) {
						return { ...todo, completedAt: todo.completedAt ? null : new Date().toISOString() }
					}
					return todo
				})
			})
		}

		if (key.name === 'd') {
			setTodos((prev) => {
				return prev.filter((todo) => {
					if (!todo.assignedDate) return true
					const isFocusedDate = dateIndicies[todo.assignedDate] === focused.date
					const row = (todosByDay[todo.assignedDate]?.findIndex((item) => item.text === todo.text) ?? 0) + 1
					if (isFocusedDate && row === focused.row) {
						return false
					}
					return true
				})
			})
			dispatch({ type: 'MOVE_UP', todos: todosByDay })
		}
	})

	const isSelected = ({ date, row }: { date: Weekday, row: number }) => {
		return focused.date === dateIndicies[date] && focused.row === row
	}

	const addTodo = (todo: Todo) => {
		setTodos((prev) => [...prev, todo])
	}

	return (
		<group padding={2}>
			<text fg="#00FF00">Hello, Todos!</text>
			<group style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
				<Day isSelected={isSelected} date={dates.sunday} todos={todosByDay[dates.sunday] ?? []} addTodo={addTodo} weekdayName="Sunday" />
				<Day isSelected={isSelected} date={dates.monday} todos={todosByDay[dates.monday] ?? []} addTodo={addTodo} weekdayName="Monday" />
				<Day isSelected={isSelected} date={dates.tuesday} todos={todosByDay[dates.tuesday] ?? []} addTodo={addTodo} weekdayName="Tuesday" />
				<Day isSelected={isSelected} date={dates.wednesday} todos={todosByDay[dates.wednesday] ?? []} addTodo={addTodo} weekdayName="Wednesday" />
				<Day isSelected={isSelected} date={dates.thursday} todos={todosByDay[dates.thursday] ?? []} addTodo={addTodo} weekdayName="Thursday" />
				<Day isSelected={isSelected} date={dates.friday} todos={todosByDay[dates.friday] ?? []} addTodo={addTodo} weekdayName="Friday" />
				<Day isSelected={isSelected} date={dates.saturday} todos={todosByDay[dates.saturday] ?? []} addTodo={addTodo} weekdayName="Saturday" />
			</group>
		</group>
	)
}

function Day({ isSelected, date, todos, addTodo, weekdayName }: { isSelected: ({ date, row }: { date: string, row: number }) => boolean, date: string, todos: Todo[], addTodo: (todo: Todo) => void, weekdayName: string }) {
	return (

		<group style={{ flexDirection: 'column' }}>
			<box border={['bottom']} borderColor="#FFFFFF">
				<text fg="#FFFFFF">{weekdayName} {addDays(weekStart, 1).toLocaleDateString()}</text>
			</box>
			<box backgroundColor={isSelected({ date, row: 0 }) ? "#FFFFFF" : "#424242"}>
				<TodoInput addTodo={addTodo} focused={isSelected({ date, row: 0 })} date={date} />
			</box>
			{/* for some reason, the first box overlaps the input box */}
			{/* so we add an empty box to push the other boxes down */}
			<box><text /></box>
			{todos.map((todo, index) => (
				<box key={index} backgroundColor={isSelected({ date, row: index + 1 }) ? "#FFFFFF" : "#424242"}>
					<text fg={isSelected({ date, row: index + 1 }) ? "#424242" : "#FFFFFF"}>
						{todo.completedAt ? strikethrough(todo.text) : todo.text}
					</text>
				</box>
			))}
		</group>
	)
}

function TodoInput({ addTodo, focused, date }: { addTodo: (todo: Todo) => void, focused: boolean, date: string }) {
	const [input, setInput] = useState('')

	return (
		<box title="Add Todo">
			<input placeholder="Add Todo" value={input} onInput={setInput} focused={focused} onSubmit={() => {
				if (input.trim() === '') return
				addTodo({ text: input, completedAt: null, assignedDate: date, createdAt: new Date().toISOString() })
				setInput('')
			}} />
		</box>
	)
}

function getCurrentWeek() {
	const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
	const today = new Date()
	const currentWeekday = days[today.getDay()]
	const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
	const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
	return { currentWeekday, weekStart, weekEnd }
}

function addDays(date: Date, days: number) {
	const result = new Date(date)
	result.setDate(result.getDate() + days)
	return result
}

render(<App />)
