import { ChannelButton } from "@/components/ChannelButton";
import { useTwitchAuth } from "@/lib/store/auth";
import type { StreamInfo } from "@/lib/twitch/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Alert,
	Button,
	RefreshControl,
	ScrollView,
	StyleSheet,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CHANNELS = ["ironmouse", "cdawgva", "philza", "tubbo", "chrrrs"];

export default function () {
	const client = useTwitchAuth((store) => store.client);
	const logout = useTwitchAuth((store) => store.logout);

	const [streams, setStreams] = useState(
		Object.fromEntries(CHANNELS.map((channel) => [channel, {} as StreamInfo])),
	);
	const [refreshing, setRefreshing] = useState(true);

	const sortedChannels = useMemo(
		() =>
			[...Object.keys(streams)].sort((a, b) => {
				const viewersA = streams[a].stream?.viewers;
				const viewersB = streams[b].stream?.viewers;
				return (viewersB ?? -1) - (viewersA ?? -1) || a.localeCompare(b);
			}),
		[streams],
	);

	const refresh = useCallback(async () => {
		if (client === null) {
			return setStreams({});
		}

		setRefreshing(true);
		setStreams(await client.getStreams(Object.keys(streams)));
		setRefreshing(false);
	}, [streams, client]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: We don't want it to refresh in a loop.
	useEffect(() => {
		refresh();
	}, []);

	function addChannel(login: string) {
		setStreams((streams) => ({ ...streams, [login]: {} }));
		client?.getStreams([login]).then((res) => {
			setStreams((streams) => ({ ...streams, [login]: res[login] }));
		});
	}

	return (
		<SafeAreaView>
			<ScrollView
				style={styles.scroller}
				refreshControl={
					<RefreshControl onRefresh={refresh} refreshing={refreshing} />
				}
			>
				<View style={styles.channels}>
					{sortedChannels.map((login) => (
						<ChannelButton key={login} login={login} info={streams[login]} />
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
