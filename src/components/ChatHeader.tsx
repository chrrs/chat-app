import { Colors } from "@/lib/constants/Colors";
import type { UserInfo } from "@/lib/twitch/client";
import { useRouter } from "expo-router";
import { ChevronLeftIcon, SettingsIcon } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
	user: UserInfo;
}

export const ChatHeader = ({ user }: Props) => {
	const router = useRouter();

	return (
		<View style={styles.root}>
			<TouchableOpacity
				style={styles.button}
				onPress={() => router.dismiss()}
				activeOpacity={0.5}
			>
				<ChevronLeftIcon color={Colors.normalText} />
			</TouchableOpacity>
			<Text style={styles.title}>{user.name}</Text>
			<TouchableOpacity style={styles.button} activeOpacity={0.5}>
				<SettingsIcon color={Colors.normalText} />
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingBottom: 8,
	},

	title: {
		flex: 1,
		textAlign: "center",
		color: Colors.normalText,
		fontWeight: 700,
		fontSize: 18,
	},

	button: {
		backgroundColor: Colors.inputBackground,
		borderRadius: 4,
		padding: 4,
	},
});
