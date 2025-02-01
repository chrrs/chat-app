import { BadgeProvider, type Badges } from "@/components/BadgeProvider";
import { CenteredSpinner } from "@/components/CenteredSpinner";
import { Chat } from "@/components/Chat";
import { Colors } from "@/lib/constants/Colors";
import { useTwitchAuth } from "@/lib/store/auth";
import type { Channel } from "@/lib/twitch/channel";
import { eMsg } from "@/lib/util";
import { useLocalSearchParams } from "expo-router";
import { CircleAlertIcon } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function () {
	const client = useTwitchAuth((store) => store.client);
	const [globalBadges, setGlobalBadges] = useState({} as Badges);

	const { login } = useLocalSearchParams();

	const [channel, setChannel] = useState(null as Channel | null);
	const [isFetching, setFetching] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (client == null) return;

		setFetching(true);
		client
			.getChannel(String(login))
			.then((channel) => {
				setChannel(channel);
				setFetching(false);
			})
			.catch((err) => {
				setError(eMsg(err));
				setFetching(false);
			});
	}, [client, login]);

	useEffect(() => {
		const c = channel;
		return () => c?.close();
	}, [channel]);

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
		<BadgeProvider badges={globalBadges}>
			<SafeAreaView>
				<KeyboardAvoidingView behavior="padding">
					<View>
						{isFetching ? (
							<CenteredSpinner text="Joining..." />
						) : error || !channel ? (
							<View style={styles.error}>
								<View style={styles.title}>
									<CircleAlertIcon size={20} color={Colors.errorText} />
									<Text style={{ color: Colors.errorText, fontWeight: "bold" }}>
										Could not join channel.
									</Text>
								</View>

								{error.length > 0 && (
									<Text style={styles.subtitle}>{error}</Text>
								)}
							</View>
						) : (
							<Chat key={String(login)} channel={channel} />
						)}
					</View>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</BadgeProvider>
	);
}

const styles = StyleSheet.create({
	error: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		gap: 16,

		height: "100%",
	},

	title: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	subtitle: {
		color: Colors.mutedText,
	},
});
