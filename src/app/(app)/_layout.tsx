import { CenteredSpinner } from "@/components/CenteredSpinner";
import { Colors } from "@/lib/constants/Colors";
import { useTwitchAuth } from "@/lib/store/auth";
import * as Network from "expo-network";
import { Redirect, Stack } from "expo-router";
import { useEffect } from "react";

export default function () {
	const auth = useTwitchAuth();

	const ircClient = auth.session?.ircClient;
	useEffect(() => {
		if (ircClient) {
			// Connect to IRC client
			(async () => {
				const networkState = await Network.getNetworkStateAsync();
				if (networkState.isConnected && networkState.isInternetReachable) {
					ircClient.connect();
				}
			})();

			// Set up network state listeners
			const listener = Network.addNetworkStateListener(async () => {
				const networkState = await Network.getNetworkStateAsync();
				if (networkState.isConnected && networkState.isInternetReachable) {
					ircClient.connect();
				} else {
					ircClient.disconnect();
				}
			});

			// Disconnect on session change
			return () => {
				listener.remove();
				ircClient.disconnect();
			};
		}
	}, [ircClient]);

	if (auth.status !== "ready") {
		return <CenteredSpinner text="Authenticathing..." />;
	}

	if (!auth.session) {
		return <Redirect href="/sign-in" />;
	}

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: Colors.background },
			}}
		>
			<Stack.Screen name="index" />
			<Stack.Screen name="chat/[login]" />
		</Stack>
	);
}
