import { Colors } from "@/lib/constants/Colors";
import { Link } from "expo-router";
import { CatIcon } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export const FollowedButton = () => {
	return (
		<Link href="/followed" asChild>
			<TouchableOpacity style={styles.pressable} activeOpacity={0.5}>
				<CatIcon />
				<Text style={styles.text}>Followed Channels</Text>
			</TouchableOpacity>
		</Link>
	);
};

const styles = StyleSheet.create({
	pressable: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,

		paddingHorizontal: 16,
		paddingVertical: 12,

		borderBottomWidth: 1,
		borderBottomColor: Colors.secondaryButtonBackground,
	},

	text: {
		color: Colors.normalText,
		fontSize: 16,
		fontWeight: "bold",
	},
});
