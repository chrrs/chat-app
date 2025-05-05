import { Colors } from "@/lib/constants/Colors";
import type { HelixStream } from "@twurple/api";
import { Link } from "expo-router";
import { User } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
	stream: HelixStream;
}

export const StreamButton = ({ stream }: Props) => {
	return (
		<Link
			href={{
				pathname: "/chat/[login]",
				params: { login: stream.userName, displayName: stream.userDisplayName },
			}}
			asChild
		>
			<TouchableOpacity style={styles.pressable} activeOpacity={0.5}>
				<View style={styles.header}>
					<Text style={styles.name}>{stream.userDisplayName}</Text>

					<View style={styles.viewersWrapper}>
						<Text style={{ color: Colors.viewersText }}>
							{stream.viewers.toLocaleString("en-US")}
						</Text>
						<User size={16} color={Colors.viewersText} />
					</View>
				</View>

				<Text numberOfLines={2} style={styles.title}>
					{stream.title}
				</Text>

				<Text style={styles.game}>{stream.gameName}</Text>
			</TouchableOpacity>
		</Link>
	);
};

const styles = StyleSheet.create({
	pressable: {
		paddingHorizontal: 16,
		paddingVertical: 12,

		borderBottomWidth: 1,
		borderBottomColor: Colors.secondaryButtonBackground,
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
		color: Colors.normalText,
		fontWeight: "bold",
		marginBottom: 4,
	},

	title: {
		color: Colors.normalText,
		marginBottom: 4,
	},

	game: {
		color: Colors.mutedText,
		fontWeight: "bold",
		fontSize: 12,
	},
});
