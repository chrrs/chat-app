import type { Event } from "@/lib/irc/chat";
import { StyleSheet, View } from "react-native";
import { InlineMessage } from "./InlineMessage";

interface Props {
	event: Event.Message;
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
		paddingVertical: 3,
	},
});
