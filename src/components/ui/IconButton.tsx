import type { LucideIcon } from "lucide-react-native";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/lib/constants/Colors";

interface Props {
	icon: LucideIcon;
	onPress?: () => void;
}

export const IconButton = ({ icon: Icon, onPress }: Props) => {
	return (
		<TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.5}>
			<Icon color={Colors.text.normal} />
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	button: {
		backgroundColor: Colors.widget.secondary.background,
		borderRadius: 8,
		padding: 4,
	},
});
