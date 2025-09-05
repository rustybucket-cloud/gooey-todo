import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ViewMode = "week" | "day";

interface RouterContextType {
	currentView: ViewMode;
	selectedDate?: string;
	goToWeekView: () => void;
	goToDayView: (date?: string) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const useRouter = () => {
	const context = useContext(RouterContext);
	if (!context) {
		throw new Error('useRouter must be used within a RouterProvider');
	}
	return context;
};

export default function RouterProvider({ children }: { children: ReactNode }) {
	const [currentView, setCurrentView] = useState<ViewMode>("week");
	const [selectedDate, setSelectedDate] = useState<string | undefined>();

	const goToWeekView = useCallback(() => {
		setCurrentView("week");
		setSelectedDate(undefined);
	}, []);

	const goToDayView = useCallback((date?: string) => {
		setCurrentView("day");
		if (date) {
			setSelectedDate(date);
		}
	}, []);

	const value: RouterContextType = {
		currentView,
		selectedDate,
		goToWeekView,
		goToDayView
	};

	return (
		<RouterContext.Provider value={value}>
			{children}
		</RouterContext.Provider>
	);
}