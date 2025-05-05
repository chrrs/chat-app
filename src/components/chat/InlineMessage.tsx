import { Colors } from "@/lib/constants/Colors";
import type { ChatMessage } from "@/lib/irc/chat";
import { StyleSheet, Text } from "react-native";

interface Props {
	message: ChatMessage;
}

export const InlineMessage = ({ message }: Props) => {
	return (
		<Text style={styles.message}>
			<Text style={[styles.name, { color: message.author.color }]}>{message.author.name}:</Text>

			<Text>{` ${message.text}`}</Text>
		</Text>
	);
};

const styles = StyleSheet.create({
	message: {
		color: Colors.normalText,
	},

	name: {
		fontWeight: "bold",
	},

	badgeWrapper: {
		width: 18 + 4,
	},

	badge: {
		bottom: -3,
		width: 18,
		height: 18,
	},

	emote: {
		bottom: -3,
		height: 20,
	},

	mention: {
		fontWeight: "bold",
	},
});
