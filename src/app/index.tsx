import { ChannelButton } from "@/components/ChannelButton";
import { useTwitchAuth } from "@/lib/store/auth";
import type { StreamInfo } from "@/lib/twitch/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Alert,
	Button,
	RefreshControl,
	ScrollView,
	StyleSheet,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CHANNELS = ["ironmouse", "cdawgva", "philza", "tubbo", "chrrrs", "fitmc"];

export default function () {
	const client = useTwitchAuth((store) => store.client);
	const logout = useTwitchAuth((store) => store.logout);

	const channelsRef = useRef(CHANNELS);
	const [streams, setStreams] = useState(
		Object.fromEntries(
			channelsRef.current.map((channel) => [channel, {}]),
		) as Record<string, StreamInfo>,
	);

	const [refreshing, setRefreshing] = useState(true);

	const sortedStreams = useMemo(
		() =>
			[...Object.entries(streams)].sort((a, b) => {
				const viewersA = a[1].stream?.viewers;
				const viewersB = b[1].stream?.viewers;
				return (viewersB ?? -1) - (viewersA ?? -1) || a[0].localeCompare(b[0]);
			}),
		[streams],
	);

	const refetchStreams = useCallback(async () => {
		if (client === null) {
			return setStreams({});
		}

		setRefreshing(true);
		setStreams(await client.fetchStreams(channelsRef.current));
		setRefreshing(false);
	}, [client]);

	const addChannel = (login: string) => {
		channelsRef.current = [...channelsRef.current, login];
		setStreams((streams) => ({ ...streams, [login]: {} }));

		client?.fetchStreams([login]).then((res) => {
			setStreams((streams) => ({ ...streams, [login]: res[login] }));
		});
	};

	useEffect(() => {
		refetchStreams();
	}, [refetchStreams]);

	return (
		<SafeAreaView>
			<ScrollView
				style={styles.scroller}
				refreshControl={
					<RefreshControl onRefresh={refetchStreams} refreshing={refreshing} />
				}
			>
				<View style={styles.channels}>
					{sortedStreams.map(([login, info]) => (
						<ChannelButton key={login} login={login} info={info} />
					))}
				</View>

				<Button
					title="Add channel..."
					onPress={() => {
						Alert.prompt("Add channel", "Enter channel name...", addChannel);
					}}
				/>

				<Button title="Sign out" onPress={logout} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	scroller: {
		height: "100%",
		padding: 8,
	},

	channels: {
		display: "flex",
		flexDirection: "column",
		marginBottom: 24,
	},
});
