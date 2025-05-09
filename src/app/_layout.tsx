import {
	QueryCache,
	QueryClient,
	QueryClientProvider,
	focusManager,
	onlineManager,
} from "@tanstack/react-query";
import * as Network from "expo-network";
import { Slot } from "expo-router";
import { useEffect } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: console.error,
	}),
});

onlineManager.setEventListener((setOnline) => {
	const eventSubscription = Network.addNetworkStateListener((state) => {
		setOnline(!!state.isConnected);
	});

	return eventSubscription.remove;
});

function onAppStateChange(status: AppStateStatus) {
	if (Platform.OS !== "web") {
		focusManager.setFocused(status === "active");
	}
}

export default function () {
	useEffect(() => {
		const subscription = AppState.addEventListener("change", onAppStateChange);
		return () => subscription.remove();
	}, []);

	return (
		<GestureHandlerRootView onMoveShouldSetResponder={() => true}>
			<QueryClientProvider client={queryClient}>
				<Slot />
			</QueryClientProvider>
		</GestureHandlerRootView>
	);
}
