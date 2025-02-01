import { BadgeProvider, type Badges } from "@/components/BadgeProvider";
import { Chat } from "@/components/Chat";
import { useTwitchAuth } from "@/lib/store/auth";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function () {
	const client = useTwitchAuth((store) => store.client);
	const [globalBadges, setGlobalBadges] = useState({} as Badges);
	const { login } = useLocalSearchParams();

	useEffect(() => {
		if (client) {
			client
				.fetchGlobalBadges()
				.then((badges) => setGlobalBadges(badges))
				.catch((error) =>
					console.error("error while fetching global badges", error),
				);
		}
	}, [client]);

	return (
		<SafeAreaView>
			<KeyboardAvoidingView behavior="padding">
				<BadgeProvider badges={globalBadges}>
					<Chat key={String(login)} login={String(login)} />
				</BadgeProvider>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
