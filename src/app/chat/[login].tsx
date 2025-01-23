import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView } from "react-native";
import { BadgeProvider, type Badges } from "@/components/BadgeProvider";
import { Chat } from "@/components/Chat";
import { useLocalSearchParams } from "expo-router";
import { useTwitchAuth } from "@/lib/store/auth";

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
