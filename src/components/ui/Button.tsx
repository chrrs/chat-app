import { Colors } from "@/lib/constants/Colors";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface Props {
	type: "primary" | "secondary";
	disabled?: boolean;
	onPress?: () => void;
	children: string;
}

export const Button = ({ type, disabled, onPress, children }: Props) => {
	const bg = type === "primary" ? Colors.primaryBackground : Colors.secondaryBackground;
	const fg = type === "primary" ? "white" : Colors.normalText;

	return (
		<TouchableOpacity
			style={[styles.button, { opacity: disabled ? 0.5 : 1.0, backgroundColor: bg }]}
			activeOpacity={0.5}
			onPress={onPress}
		>
			<Text style={[styles.text, { color: fg }]}>{children}</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	button: {
		borderRadius: 8,
		padding: 8,
	},

	text: {
		textAlign: "center",
	},
});
