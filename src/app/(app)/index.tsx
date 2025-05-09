import { FollowedButton } from "@/components/FollowedButton";
import { Header } from "@/components/Header";
import { StreamButton } from "@/components/StreamButton";
import { SwipeToDelete } from "@/components/SwipeToDelete";
import { IconButton } from "@/components/ui/IconButton";
import { useRefetchByUser } from "@/lib/hooks/useRefetchByUser";
import { useTwitchAuth } from "@/lib/store/auth";
import { useChannels } from "@/lib/store/channels";
import { useQuery } from "@tanstack/react-query";
import { DoorOpenIcon, PlusIcon } from "lucide-react-native";
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function () {
	const signOut = useTwitchAuth((state) => state.signOut);
	const session = useTwitchAuth((state) => state.session);

	const { channels, getChannels, addChannel, removeChannel } = useChannels();

	const users = useQuery({
		queryKey: ["home", "users"],
		queryFn: async () => await session!.apiClient.users.getUsersByNames(getChannels()),
	});

	const streams = useQuery({
		queryKey: ["home", "streams"],
		queryFn: async () => await session!.apiClient.streams.getStreamsByUserNames(getChannels()),
	});

	const refetchAll = async () => await Promise.all([streams.refetch(), users.refetch()]);
	const { isRefetchingByUser, refetchByUser } = useRefetchByUser(refetchAll);

	// Sort channels first by online status, then by number of viewers, and finally by display name
	const sortedChannels = [...channels].sort((a, b) => {
		const aStream = streams.data?.find((stream) => stream.userName === a);
		const bStream = streams.data?.find((stream) => stream.userName === b);

		if (aStream && !bStream) return -1;
		if (!aStream && bStream) return 1;

		if ((aStream?.viewers ?? 0) > (bStream?.viewers ?? 0)) return -1;
		if ((aStream?.viewers ?? 0) < (bStream?.viewers ?? 0)) return 1;

		return a.localeCompare(b);
	});

	const trySignOut = () => {
		Alert.alert("Sign out?", "You'll have to log back in with your Twitch account", [
			{ text: "Cancel", style: "cancel" },
			{ text: "Sign out", onPress: signOut },
		]);
	};

	const tryAddChannel = () => {
		Alert.prompt("Add channel", "Enter the Twitch username of the channel", (login) => {
			addChannel(login);
			refetchAll();
		});
	};

	return (
		<SafeAreaView edges={["top", "left", "right"]}>
			<View style={styles.root}>
				<Header
					left={<IconButton icon={DoorOpenIcon} onPress={trySignOut} />}
					right={<IconButton icon={PlusIcon} onPress={tryAddChannel} />}
					title="Home"
				/>

				<ScrollView
					style={styles.scroller}
					refreshControl={
						<RefreshControl onRefresh={refetchByUser} refreshing={isRefetchingByUser} />
					}
				>
					<SafeAreaView edges={["bottom"]}>
						<FollowedButton />

						{sortedChannels.map((channel) => (
							<SwipeToDelete key={channel} onDelete={() => removeChannel(channel)}>
								<StreamButton
									login={channel}
									user={users.data?.find((user) => user.name === channel)}
									stream={streams.data?.find((stream) => stream.userName === channel)}
								/>
							</SwipeToDelete>
						))}
					</SafeAreaView>
				</ScrollView>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: {
		width: "100%",
		height: "100%",
	},
	scroller: {
		flex: 1,
	},
});
