import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeftIcon } from "lucide-react-native";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CenteredError } from "@/components/CenteredError";
import { CenteredSpinner } from "@/components/CenteredSpinner";
import { Header } from "@/components/Header";
import { StreamButton } from "@/components/StreamButton";
import { IconButton } from "@/components/ui/IconButton";
import { useRefetchByUser } from "@/lib/hooks/useRefetchByUser";
import { useTwitchAuth } from "@/lib/store/auth";

export default function () {
	const router = useRouter();
	const session = useTwitchAuth((state) => state.session);

	const streams = useQuery({
		queryKey: ["followed", "streams"],
		queryFn: async () => {
			const res = session!.apiClient.streams.getFollowedStreamsPaginated(session!.userId);
			return await res.getAll();
		},
	});

	const { isRefetchingByUser, refetchByUser } = useRefetchByUser(streams.refetch);

	return (
		<SafeAreaView edges={["top", "left", "right"]}>
			<View style={styles.root}>
				<Header
					left={<IconButton icon={ChevronLeftIcon} onPress={router.back} />}
					title="Followed Channels"
				/>

				{streams.status === "pending" && <CenteredSpinner text="Fetching streams..." />}
				{streams.status === "error" && <CenteredError text="Couldn't fetch streams." />}

				{streams.status === "success" && (
					<ScrollView
						style={styles.scroller}
						refreshControl={
							<RefreshControl onRefresh={refetchByUser} refreshing={isRefetchingByUser} />
						}
					>
						<SafeAreaView edges={["bottom"]}>
							{streams.data.map((stream) => (
								<StreamButton key={stream.id} login={stream.userName} stream={stream} />
							))}
						</SafeAreaView>
					</ScrollView>
				)}
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
