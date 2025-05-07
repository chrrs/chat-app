import { CenteredSpinner } from "@/components/CenteredSpinner";
import { BadgeProvider } from "@/components/context/BadgeProvider";
import { ThirdPartyEmoteProvider } from "@/components/context/ThirdPartyEmoteProvider";
import { Colors } from "@/lib/constants/Colors";
import { fetchGlobalEmotes } from "@/lib/message/emotes";
import { useTwitchAuth } from "@/lib/store/auth";
import { useQuery } from "@tanstack/react-query";
import * as Network from "expo-network";
import { Redirect, Stack } from "expo-router";
import { useEffect } from "react";

export default function () {
	const auth = useTwitchAuth();

	if (auth.status !== "ready") {
		return <CenteredSpinner text="Authenticathing..." />;
	}

	if (!auth.session) {
		return <Redirect href="/sign-in" />;
	}

	return <AuthenticatedLayout />;
}

const AuthenticatedLayout = () => {
	const session = useTwitchAuth((state) => state.session);

	const ircClient = session!.ircClient;
	useEffect(() => {
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
	}, [ircClient]);

	const globalBadges = useQuery({
		queryKey: ["badges", "global"],
		queryFn: async () => await session!.apiClient.chat.getGlobalBadges(),
	});

	const globalEmotes = useQuery({
		queryKey: ["emotes", "global"],
		queryFn: async () => await fetchGlobalEmotes(),
	});

	return (
		<BadgeProvider badges={globalBadges.data ?? []}>
			<ThirdPartyEmoteProvider emotes={globalEmotes.data ?? {}}>
				<Stack
					screenOptions={{
						headerShown: false,
						contentStyle: { backgroundColor: Colors.background },
					}}
				>
					<Stack.Screen name="index" />
					<Stack.Screen name="chat/[login]" />
				</Stack>
			</ThirdPartyEmoteProvider>
		</BadgeProvider>
	);
};
