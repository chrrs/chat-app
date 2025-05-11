import { Colors } from "@/lib/constants/Colors";
import type { HelixStream, HelixUser } from "@twurple/api";
import { Link } from "expo-router";
import { User } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
	login: string;
	user?: HelixUser;
	stream?: HelixStream;
}

export const StreamButton = ({ login, user, stream }: Props) => {
	const displayName = user?.displayName ?? stream?.userDisplayName;

	return (
		<Link href={{ pathname: "/chat/[login]", params: { login, displayName } }} asChild>
			<TouchableOpacity style={styles.pressable} activeOpacity={0.5}>
				<View style={styles.header}>
					<Text style={styles.name}>{displayName ?? login}</Text>

					{stream && (
						<View style={styles.viewersWrapper}>
							<Text style={{ color: Colors.text.viewers }}>
								{stream.viewers.toLocaleString("en-US")}
							</Text>
							<User size={16} color={Colors.text.viewers} />
						</View>
					)}
				</View>

				<Text numberOfLines={2} style={styles.title}>
					{stream?.title || "offline"}
				</Text>

				{stream && <Text style={styles.game}>{stream.gameName}</Text>}
			</TouchableOpacity>
		</Link>
	);
};

const styles = StyleSheet.create({
	pressable: {
		paddingHorizontal: 16,
		paddingVertical: 12,

		borderBottomWidth: 1,
		borderBottomColor: Colors.widget.secondary.background,
	},

	header: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-between",
	},

	viewersWrapper: {
		display: "flex",
		flexDirection: "row",
		gap: 2,
	},

	name: {
		color: Colors.text.normal,
		fontWeight: "bold",
		marginBottom: 4,
	},

	title: {
		color: Colors.text.normal,
	},

	game: {
		color: Colors.text.muted,
		fontWeight: "bold",
		fontSize: 12,
		marginTop: 4,
	},
});
