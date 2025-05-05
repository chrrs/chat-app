import { Colors } from "@/lib/constants/Colors";
import type { LucideIcon } from "lucide-react-native";
import { StyleSheet, TouchableOpacity } from "react-native";

interface Props {
	icon: LucideIcon;
	onPress?: () => void;
}

export const IconButton = ({ icon: Icon, onPress }: Props) => {
	return (
		<TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.5}>
			<Icon color={Colors.normalText} />
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	button: {
		backgroundColor: Colors.inputBackground,
		borderRadius: 8,
		padding: 4,
	},
});
