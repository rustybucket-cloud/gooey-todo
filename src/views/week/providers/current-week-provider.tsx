import { createContext, useState, useCallback, useMemo, type ReactNode } from "react";

const CurrentWeekContent = createContext({})

export default function CurrentWeekProvider({ children }: { children: ReactNode }) {
	const [weekOffset, setWeekOffset] = useState(0)

	const currentWeek = useMemo(() => getCurrentWeek(weekOffset), [weekOffset])

	const goToNextWeek = useCallback(() => {
		setWeekOffset((prev) => prev + 1)
	}, [])

	const goToPreviousWeek = useCallback(() => {
		setWeekOffset((prev) => prev - 1)
	}, [])

	return <CurrentWeekContent.Provider value={{ currentWeek, goToNextWeek, goToPreviousWeek }}>{children}</CurrentWeekContent.Provider>
}

function getCurrentWeek(weekOffset = 0) {
	const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
	let currentDay = new Date()
	if (weekOffset !== 0) {
		currentDay = addDays(currentDay, weekOffset)
	}
	const currentWeekday = days[currentDay.getDay()]
	// Calculate Monday as week start: if currentDay is Sunday (0), go back 6 days, otherwise go back (day - 1) days
	const daysSinceMonday = currentDay.getDay() === 0 ? 6 : currentDay.getDay() - 1
	const weekStart = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate() - daysSinceMonday)
	const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
	return { currentWeekday, weekStart, weekEnd }
}

function addDays(date: Date, days: number) {
	const result = new Date(date)
	result.setDate(result.getDate() + days)
	return result
}
