import { Colors } from "@/lib/constants/Colors";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export const CenteredSpinner = ({ text }: { text: string }) => {
	return (
		<View style={styles.root}>
			<ActivityIndicator />
			<Text style={styles.label}>{text}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		backgroundColor: Colors.background.normal,

		display: "flex",
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",

		height: "100%",
		gap: 16,
	},

	label: {
		color: Colors.text.muted,
		textAlign: "center",
	},
});
