import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { addDays } from "../../../utils"

interface CurrentDayContextType {
	currentDay: { date: Date; dateString: string };
	goToNextDay: () => void;
	goToPreviousDay: () => void;
}

const CurrentDayContext = createContext<CurrentDayContextType | undefined>(undefined);

export const useCurrentDay = () => {
	const context = useContext(CurrentDayContext);
	if (!context) {
		throw new Error('useCurrentDay must be used within a CurrentDayProvider');
	}
	return context;
};

export default function CurrentDayProvider({ children }: { children: ReactNode }) {
	const [dayOffset, setDayOffset] = useState(0)

	const currentDay = useMemo(() => {
		const date = addDays(new Date(), dayOffset);
		const dateString = date.toISOString().substring(0, 10);
		return { date, dateString };
	}, [dayOffset])

	const goToNextDay = useCallback(() => {
		setDayOffset((prev) => prev + 1)
	}, [])

	const goToPreviousDay = useCallback(() => {
		setDayOffset((prev) => prev - 1)
	}, [])

	return <CurrentDayContext.Provider value={{ currentDay, goToNextDay, goToPreviousDay }}>{children}</CurrentDayContext.Provider>
}