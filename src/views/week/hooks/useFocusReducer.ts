type Focus = {
	date: number
	row: number
	lastWeekday?: number
}

type ACTIONS = 'MOVE_DOWN' | 'MOVE_UP' | 'MOVE_RIGHT' | 'MOVE_LEFT' | 'JUMP_TO_SOMEDAY' | 'JUMP_FROM_SOMEDAY'

function reducer(state: Focus, action: { type: ACTIONS; todos?: TodosByDay }) {
	const todosByDay = action.todos || {}
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
		case 'JUMP_TO_SOMEDAY':
			if (state.date === dateIndicies[dates.someday]) return state
			return { ...state, date: dateIndicies[dates.someday], lastWeekday: state.date, }
		case 'JUMP_FROM_SOMEDAY':
			if (state.date !== dateIndicies[dates.someday]) return state
			const targetWeekday = state.lastWeekday ?? 1 // default to Monday
			const targetDateString = datesByIndex[targetWeekday as keyof typeof datesByIndex]
			const targetTodos = todosByDay[targetDateString] || []
			return { 
				date: targetWeekday, 
				row: Math.min(state.row, Math.max(targetTodos.length, 0)),
				lastWeekday: targetWeekday
			}
		default:
			return state
	}
}
