import { useQuery } from "@tanstack/react-query";
import type { HelixUser } from "@twurple/api";
import dayjs from "dayjs";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { BoxIcon, CircleXIcon, HeartIcon, StarIcon } from "lucide-react-native";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CenteredError } from "@/components/CenteredError";
import { CenteredSpinner } from "@/components/CenteredSpinner";
import { Colors } from "@/lib/constants/Colors";
import { fetchSubAge, type SubAgeResponse } from "@/lib/ivr";
import { useTwitchAuth } from "@/lib/store/auth";

const UserProfile = ({ user }: { user: HelixUser }) => {
	return (
		<View style={styles.profile}>
			<Image style={styles.pfp} source={user.profilePictureUrl} />
			<Text style={styles.name}>{user.displayName}</Text>
		</View>
	);
};

const ChannelStatus = ({ user, status }: { user: HelixUser; status: SubAgeResponse }) => {
	if (status.statusHidden) {
		return (
			<View style={styles.channelStatus}>
				<Text style={{ color: Colors.text.muted }}>Follow and subscription status hidden.</Text>
			</View>
		);
	}

	return (
		<View style={styles.channelStatus}>
			{/* Account creation date */}
			<View style={styles.age}>
				<BoxIcon color={Colors.text.normal} size={16} />
				<Text style={{ color: Colors.text.normal }}>
					Account created on{" "}
					<Text style={styles.bold}>{dayjs(user.creationDate).format("MMMM D, YYYY")}</Text>.
				</Text>
			</View>

			{/* Follow age */}
			<View style={styles.age}>
				<HeartIcon color={Colors.text.normal} size={16} />
				{status.followedAt ? (
					<Text style={{ color: Colors.text.normal }}>
						Following since{" "}
						<Text style={styles.bold}>{dayjs(status.followedAt).format("MMMM D, YYYY")}</Text>.
					</Text>
				) : (
					<Text style={{ color: Colors.text.muted }}>Not following.</Text>
				)}
			</View>

			{/* Subscription age */}
			{status.cumulative && (
				<View style={styles.age}>
					<StarIcon color={Colors.text.normal} size={16} />
					<Text style={{ color: Colors.text.normal }}>
						{status.meta ? (
							<>
								Subscribed at <Text style={styles.bold}>Tier {status.meta.tier}</Text>{" "}
							</>
						) : (
							"Previously subscribed"
						)}
						for <Text style={styles.bold}>{status.cumulative.months} months</Text>.
					</Text>
				</View>
			)}
		</View>
	);
};

export default function () {
	const session = useTwitchAuth((state) => state.session);
	const { login, channel } = useLocalSearchParams<{ login: string; channel: string }>();

	const user = useQuery({
		queryKey: ["user", "login", login],
		queryFn: async () => session!.apiClient.users.getUserByName(login),
	});

	const status = useQuery({
		queryKey: ["user", login, "subAge", channel],
		queryFn: async () => fetchSubAge(login, channel!),
		enabled: !!channel,
	});

	if (user.status === "pending") {
		return <CenteredSpinner text="Fetching user data..." />;
	}

	if (user.status === "error" || user.data === null) {
		return <CenteredError text="Couldn't fetch user data" />;
	}

	return (
		<SafeAreaView>
			<UserProfile user={user.data} />

			{/* Channel status */}
			{!channel ? (
				false
			) : status.status === "pending" ? (
				<View style={styles.channelStatus}>
					<ActivityIndicator />
				</View>
			) : status.status === "error" ? (
				<View style={styles.channelStatus}>
					<CircleXIcon color={Colors.text.error} />
					<Text style={{ color: Colors.text.error }}>
						Couldn't fetch follow and subscription status.
					</Text>
				</View>
			) : (
				<ChannelStatus user={user.data} status={status.data} />
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	profile: {
		flexDirection: "row",
		alignItems: "center",
		padding: 8,
		gap: 16,
	},

	pfp: {
		width: 48,
		height: 48,
		borderRadius: 4,
	},

	name: {
		color: Colors.text.normal,
		fontSize: 16,
		fontWeight: "bold",
	},

	channelStatus: {
		backgroundColor: Colors.background.secondary,
		marginHorizontal: 8,
		borderRadius: 4,

		padding: 8,
		gap: 6,
	},

	age: {
		flexDirection: "row",
		color: Colors.text.normal,
		alignItems: "center",
		gap: 6,
	},

	bold: {
		fontWeight: "bold",
	},
});
