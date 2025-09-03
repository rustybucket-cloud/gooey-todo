import { useState, useReducer } from 'react'
import { render, useKeyboard, useRenderer, useTerminalDimensions } from '@opentui/react'
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
	someday: 'someday',
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
	[dates.someday]: 7,
}

const datesByIndex = {
	0: dates.sunday,
	1: dates.monday,
	2: dates.tuesday,
	3: dates.wednesday,
	4: dates.thursday,
	5: dates.friday,
	6: dates.saturday,
	7: dates.someday,
}

type TodosByDay = {
	[dates.monday]: Todo[]
	[dates.tuesday]: Todo[]
	[dates.wednesday]: Todo[]
	[dates.thursday]: Todo[]
	[dates.friday]: Todo[]
	[dates.saturday]: Todo[]
	[dates.sunday]: Todo[]
	[dates.someday]: Todo[]
}

type Focus = {
	date: number
	row: number
	lastWeekday?: number
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
		[dates.someday]: [],
	}
	const currentDateString = datesByIndex[state.date as keyof typeof datesByIndex]
	const currentTodos = todosByDay[currentDateString] || []
	
	switch (action.type) {
		case 'MOVE_DOWN':
			if (state.row >= currentTodos.length) {
				// If at bottom of Saturday, move to Sunday input row
				if (state.date === 6) {
					return { date: 0, row: 0, lastWeekday: state.date }
				}
				// If at bottom of any other weekday (1-5, 0), move to someday
				if ((state.date >= 1 && state.date <= 5) || state.date === 0) {
					return { date: 7, row: 0, lastWeekday: state.date }
				}
				return state
			}
			return { ...state, row: state.row + 1 }
		case 'MOVE_UP':
			// If in someday (index 7) and at input row (0), go back to last weekday
			if (state.date === 7 && state.row === 0) {
				const lastWeekday = state.lastWeekday ?? 1 // default to Monday
				const lastWeekdayString = datesByIndex[lastWeekday as keyof typeof datesByIndex]
				const lastWeekdayTodos = todosByDay[lastWeekdayString] || []
				return { 
					date: lastWeekday, 
					row: Math.max(lastWeekdayTodos.length, 0),
					lastWeekday: lastWeekday
				}
			}
			// If in Sunday and at input row (0), move to Saturday bottom
			if (state.date === 0 && state.row === 0) {
				const saturdayTodos = todosByDay[dates.saturday] || []
				return { 
					date: 6, // Saturday
					row: Math.max(saturdayTodos.length, 0),
					lastWeekday: 6
				}
			}
			if (state.row === 0) return state
			return { ...state, row: state.row - 1 }
		case 'MOVE_RIGHT':
			// Top row (Mon-Fri): 1->2->3->4->5, then 5->6 (Sat)
			if (state.date >= 1 && state.date <= 4) { // Mon-Thu
				const nextDateString = datesByIndex[(state.date + 1) as keyof typeof datesByIndex]
				const nextTodos = todosByDay[nextDateString] || []
				const maxRow = Math.max(0, nextTodos.length)
				return { 
					...state, 
					date: state.date + 1,
					row: Math.min(state.row, maxRow),
					lastWeekday: state.date + 1
				}
			}
			if (state.date === 5) { // Fri -> Sat
				const nextTodos = todosByDay[dates.saturday] || []
				const maxRow = Math.max(0, nextTodos.length)
				return { 
					...state, 
					date: 6, // Saturday
					row: Math.min(state.row, maxRow),
					lastWeekday: 6
				}
			}
			if (state.date === 6) { // Sat -> Sun
				const nextTodos = todosByDay[dates.sunday] || []
				const maxRow = Math.max(0, nextTodos.length)
				return { 
					...state, 
					date: 0, // Sunday
					row: Math.min(state.row, maxRow),
					lastWeekday: 0
				}
			}
			return state // Sun, Someday can't go right
		case 'MOVE_LEFT':
			// Top row (Mon-Fri): 5->4->3->2->1
			if (state.date >= 2 && state.date <= 5) { // Tue-Fri
				const prevDateString = datesByIndex[(state.date - 1) as keyof typeof datesByIndex]
				const prevTodos = todosByDay[prevDateString] || []
				const maxPrevRow = Math.max(0, prevTodos.length)
				return { 
					...state, 
					date: state.date - 1,
					row: Math.min(state.row, maxPrevRow),
					lastWeekday: state.date - 1
				}
			}
			if (state.date === 0) { // Sun -> Sat
				const prevTodos = todosByDay[dates.saturday] || []
				const maxPrevRow = Math.max(0, prevTodos.length)
				return { 
					...state, 
					date: 6, // Saturday
					row: Math.min(state.row, maxPrevRow),
					lastWeekday: 6
				}
			}
			if (state.date === 6) { // Sat -> Fri
				const prevTodos = todosByDay[dates.friday] || []
				const maxPrevRow = Math.max(0, prevTodos.length)
				return { 
					...state, 
					date: 5, // Friday
					row: Math.min(state.row, maxPrevRow),
					lastWeekday: 5
				}
			}
			return state // Mon, Someday can't go left
		default:
			return state
	}
}

function App() {
	const [todos, setTodos] = useState<Todo[]>([])

	const [focused, dispatch] = useReducer(reducer, { date: dateIndicies[dates.monday] || 1, row: 0 })

	const { width, height } = useTerminalDimensions()

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
		[dates.someday]: todos.filter((todo) => todo.assignedDate === dates.someday),
	}

	// Calculate available height for day columns
	const headerHeight = 3 // "Hello, Todos!" + spacing
	const bottomPadding = 2 // Match the top padding
	const totalAvailableHeight = height - headerHeight - bottomPadding
	
	// Allocate height: weekdays get 2/3, someday gets 1/3
	const weekdayRowHeight = Math.floor(totalAvailableHeight * (2/3))
	const somedayRowHeight = totalAvailableHeight - weekdayRowHeight
	
	// Each day needs header + input + spacing box, so subtract 3
	const weekdayBoxCount = Math.max(3, weekdayRowHeight - 3)
	const weekendBoxCount = Math.max(2, Math.floor(weekdayBoxCount / 2))
	const somedayBoxCount = Math.max(2, somedayRowHeight - 3)

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
		<group padding={1}>
			<text fg="#00FF00">Todoui!</text>
			<group style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
				<Day isSelected={isSelected} date={dates.monday} todos={todosByDay[dates.monday] ?? []} addTodo={addTodo} weekdayName="Monday" minBoxes={weekdayBoxCount} />
				<Day isSelected={isSelected} date={dates.tuesday} todos={todosByDay[dates.tuesday] ?? []} addTodo={addTodo} weekdayName="Tuesday" minBoxes={weekdayBoxCount} />
				<Day isSelected={isSelected} date={dates.wednesday} todos={todosByDay[dates.wednesday] ?? []} addTodo={addTodo} weekdayName="Wednesday" minBoxes={weekdayBoxCount} />
				<Day isSelected={isSelected} date={dates.thursday} todos={todosByDay[dates.thursday] ?? []} addTodo={addTodo} weekdayName="Thursday" minBoxes={weekdayBoxCount} />
				<Day isSelected={isSelected} date={dates.friday} todos={todosByDay[dates.friday] ?? []} addTodo={addTodo} weekdayName="Friday" minBoxes={weekdayBoxCount} />
				<group style={{ flexDirection: 'column' }}>
					<Day isSelected={isSelected} date={dates.saturday} todos={todosByDay[dates.saturday] ?? []} addTodo={addTodo} weekdayName="Saturday" minBoxes={weekendBoxCount} />
					<Day isSelected={isSelected} date={dates.sunday} todos={todosByDay[dates.sunday] ?? []} addTodo={addTodo} weekdayName="Sunday" minBoxes={weekendBoxCount} />
				</group>
			</group>
			<Day isSelected={isSelected} date={dates.someday} todos={todosByDay[dates.someday] ?? []} addTodo={addTodo} weekdayName="Someday" minBoxes={somedayBoxCount} />
		</group>
	)
}

function Day({ isSelected, date, todos, addTodo, weekdayName, minBoxes }: { isSelected: ({ date, row }: { date: string, row: number }) => boolean, date: string, todos: Todo[], addTodo: (todo: Todo) => void, weekdayName: string, minBoxes?: number }) {
	// Use passed minBoxes or fall back to weekend/weekday logic
	const finalMinBoxes = minBoxes ?? (weekdayName === 'Saturday' || weekdayName === 'Sunday' ? 2 : 8)
	const emptyBoxesNeeded = Math.max(0, finalMinBoxes - todos.length)
	
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
			{Array.from({ length: emptyBoxesNeeded }, (_, index) => (
				<box key={`empty-${index}`} backgroundColor="#1a1a1a">
					<text fg="#666666"> </text>
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
