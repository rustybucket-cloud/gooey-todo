import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

interface CurrentWeekContextType {
	currentWeek: { currentWeekday: string; weekStart: Date; weekEnd: Date };
	goToNextWeek: () => void;
	goToPreviousWeek: () => void;
}

const CurrentWeekContent = createContext<CurrentWeekContextType | undefined>(undefined);

export const useCurrentWeek = () => {
	const context = useContext(CurrentWeekContent);
	if (!context) {
		throw new Error('useCurrentWeek must be used within a CurrentWeekProvider');
	}
	return context;
};

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
		currentDay = addDays(currentDay, weekOffset * 7)
	}
	const currentWeekday = days[currentDay.getDay()] || 'Monday'
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
