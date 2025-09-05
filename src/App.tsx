import { Week } from "./views/week";
import { Day } from "./views/day";
import RouterProvider, { useRouter } from "./contexts/router-context";

function AppContent() {
	const { currentView } = useRouter();

	if (currentView === "day") {
		return <Day />;
	}

	return <Week />;
}

export default function App() {
	return (
		<RouterProvider>
			<AppContent />
		</RouterProvider>
	);
}
