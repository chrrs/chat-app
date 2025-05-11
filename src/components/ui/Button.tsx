import { Colors } from "@/lib/constants/Colors";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface Props {
	type: "primary" | "secondary";
	disabled?: boolean;
	onPress?: () => void;
	children: string;
}

export const Button = ({ type, disabled, onPress, children }: Props) => {
	const colors = type === "primary" ? Colors.widget.primary : Colors.widget.secondary;

	return (
		<TouchableOpacity
			style={[styles.button, { opacity: disabled ? 0.5 : 1.0, backgroundColor: colors.background }]}
			activeOpacity={0.5}
			onPress={onPress}
		>
			<Text style={[styles.text, { color: colors.foreground }]}>{children}</Text>
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
