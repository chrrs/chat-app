import {
	QueryClient,
	QueryClientProvider,
	focusManager,
	onlineManager,
} from "@tanstack/react-query";
import * as Network from "expo-network";
import { Slot } from "expo-router";
import { useEffect } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";

const queryClient = new QueryClient();

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
		<QueryClientProvider client={queryClient}>
			<Slot />
		</QueryClientProvider>
	);
}
