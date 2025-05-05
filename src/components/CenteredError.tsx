import { Colors } from "@/lib/constants/Colors";
import { CircleXIcon } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

export const CenteredError = ({ text }: { text: string }) => {
	return (
		<View style={styles.root}>
			<CircleXIcon color={Colors.errorText} />
			<Text style={styles.label}>{text}</Text>
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
		gap: 8,
	},

	label: {
		color: Colors.errorText,
		textAlign: "center",
	},
});
