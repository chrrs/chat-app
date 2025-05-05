import { Header } from "@/components/Header";
import { IconButton } from "@/components/IconButton";
import { StreamButton } from "@/components/StreamButton";
import { useTwitchAuth } from "@/lib/store/auth";
import { useQuery } from "@tanstack/react-query";
import { DoorOpenIcon } from "lucide-react-native";
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function () {
	const session = useTwitchAuth((state) => state.session);
	const signOut = useTwitchAuth((state) => state.signOut);

	const streams = useQuery({
		queryKey: ["streams"],
		queryFn: async () => {
			const res = session!.apiClient.streams.getFollowedStreamsPaginated(session!.userId);
			return await res.getAll();
		},
	});

	const trySignOut = () => {
		Alert.alert("Sign out?", "You'll have to log back in with your Twitch account", [
			{ text: "Cancel", style: "cancel" },
			{ text: "Sign out", onPress: signOut, isPreferred: true },
		]);
	};

	return (
		<SafeAreaView edges={["top", "left", "right"]}>
			<View style={styles.root}>
				<Header left={<IconButton icon={DoorOpenIcon} onPress={trySignOut} />} title="Home" />

				<ScrollView
					style={styles.scroller}
					refreshControl={
						<RefreshControl onRefresh={streams.refetch} refreshing={streams.isFetching} />
					}
				>
					<SafeAreaView edges={["bottom"]}>
						{streams.status === "success" &&
							streams.data.map((stream) => <StreamButton key={stream.id} stream={stream} />)}
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
