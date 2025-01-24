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
		client?.getGlobalBadges()?.then((badges) => setGlobalBadges(badges));
	}, [client]);

	return (
		<SafeAreaView>
			<KeyboardAvoidingView behavior="padding">
				<BadgeProvider badges={globalBadges}>
					<Chat login={String(login)} />
				</BadgeProvider>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
