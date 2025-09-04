import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { addDays } from "../../../utils"

interface CurrentWeekContextType {
	currentWeek: { currentWeekday: string; weekStart: Date; weekEnd: Date };
	dates: {
		sunday: string;
		monday: string;
		tuesday: string;
		wednesday: string;
		thursday: string;
		friday: string;
		saturday: string;
		someday: string;
	};
	dateIndices: Record<string, number>;
	datesByIndex: Record<number, string>;
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

	const dates = useMemo(() => {
		const { weekStart } = currentWeek;
		return {
			sunday: addDays(weekStart, 6).toISOString().substring(0, 10),
			monday: weekStart.toISOString().substring(0, 10),
			tuesday: addDays(weekStart, 1).toISOString().substring(0, 10),
			wednesday: addDays(weekStart, 2).toISOString().substring(0, 10),
			thursday: addDays(weekStart, 3).toISOString().substring(0, 10),
			friday: addDays(weekStart, 4).toISOString().substring(0, 10),
			saturday: addDays(weekStart, 5).toISOString().substring(0, 10),
			someday: "someday",
		};
	}, [currentWeek]);

	const dateIndices = useMemo(() => ({
		[dates.sunday]: 0,
		[dates.monday]: 1,
		[dates.tuesday]: 2,
		[dates.wednesday]: 3,
		[dates.thursday]: 4,
		[dates.friday]: 5,
		[dates.saturday]: 6,
		[dates.someday]: 7,
	}), [dates]);

	const datesByIndex = useMemo(() => ({
		0: dates.sunday,
		1: dates.monday,
		2: dates.tuesday,
		3: dates.wednesday,
		4: dates.thursday,
		5: dates.friday,
		6: dates.saturday,
		7: dates.someday,
	}), [dates]);

	const goToNextWeek = useCallback(() => {
		setWeekOffset((prev) => prev + 1)
	}, [])

	const goToPreviousWeek = useCallback(() => {
		setWeekOffset((prev) => prev - 1)
	}, [])

	return <CurrentWeekContent.Provider value={{ currentWeek, dates, dateIndices, datesByIndex, goToNextWeek, goToPreviousWeek }}>{children}</CurrentWeekContent.Provider>
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

