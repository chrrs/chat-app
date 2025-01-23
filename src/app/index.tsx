import { ChannelButton } from "@/components/ChannelButton";
import { useTwitchAuth } from "@/lib/store/auth";
import type { StreamInfo } from "@/lib/twitch/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CHANNELS = [
	"fanfan",
	"ironmouse",
	"cdawgva",
	"philza",
	"tubbo",
	"hasanabi",
	"tarik",
	"chrrrs",
	"erobb221",
];

export default function () {
	const client = useTwitchAuth((store) => store.client);

	const [channels] = useState(CHANNELS);
	const [streams, setStreams] = useState({} as Record<string, StreamInfo>);
	const [refreshing, setRefreshing] = useState(true);

	const sortedChannels = useMemo(
		() =>
			[...channels].sort((a, b) => {
				const viewersA = streams[a]?.stream?.viewers;
				const viewersB = streams[b]?.stream?.viewers;
				return (viewersB ?? -1) - (viewersA ?? -1) || a.localeCompare(b);
			}),
		[channels, streams],
	);

	const refresh = useCallback(async () => {
		if (client === null) {
			return setStreams({});
		}

		setRefreshing(true);
		setStreams(await client.getStreams(channels));
		setRefreshing(false);
	}, [channels, client]);

	useEffect(() => {
		refresh();
	}, [refresh]);

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
		gap: 8,
	},
});
