import type { ChatEvent } from "@/lib/twitch/event";
import { StyleSheet, View } from "react-native";
import { InlineMessage } from "./InlineMessage";

interface Props {
	event: ChatEvent.Message;
}

export const ChatMessage = ({ event }: Props) => {
	return (
		<View style={styles.root}>
			<InlineMessage message={event.message} />
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		paddingHorizontal: 12,
		paddingVertical: 2,
	},
});
