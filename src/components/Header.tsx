import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/lib/constants/Colors";

interface Props {
	left?: ReactNode;
	right?: ReactNode;
	title: string;
}

export const Header = ({ left, right, title }: Props) => {
	return (
		<View style={styles.root}>
			<View style={[styles.side, { flexDirection: "row" }]}>{left}</View>
			<Text style={styles.title}>{title}</Text>
			<View style={[styles.side, { flexDirection: "row-reverse" }]}>{right}</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		padding: 8,
	},

	side: {
		flex: 1,
		flexDirection: "row",
	},

	title: {
		flex: 4,
		textAlign: "center",
		color: Colors.text.normal,
		fontWeight: 700,
		fontSize: 18,
	},
});
