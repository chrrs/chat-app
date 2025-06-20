import { Link } from "expo-router";
import { CatIcon } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Colors } from "@/lib/constants/Colors";

export const FollowedButton = () => {
	return (
		<Link href="/followed" asChild>
			<TouchableOpacity style={styles.pressable} activeOpacity={0.5}>
				<CatIcon color={Colors.text.normal} />
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
		borderBottomColor: Colors.background.secondary,
	},

	text: {
		color: Colors.text.normal,
		fontSize: 16,
		fontWeight: "bold",
	},
});
