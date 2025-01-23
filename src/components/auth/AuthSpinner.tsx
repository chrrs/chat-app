import { Colors } from "@/lib/constants/Colors";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export const AuthSpinner = () => {
	return (
		<View style={styles.root}>
			<ActivityIndicator />
			<Text style={styles.label}>Authenticating...</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		backgroundColor: Colors.background,

		display: "flex",
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",

		height: "100%",
		gap: 16,
	},

	label: {
		color: Colors.mutedText,
		textAlign: "center",
	},
});
