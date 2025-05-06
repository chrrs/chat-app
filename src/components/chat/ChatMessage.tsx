import { Colors } from "@/lib/constants/Colors";
import type { Event } from "@/lib/irc/chat";
import { StyleSheet, Text, View } from "react-native";
import { InlineMessage } from "./InlineMessage";

interface Props {
	event: Event.Message;
}

export const ChatMessage = ({ event }: Props) => {
	return (
		<View style={styles.root}>
			{event.replyTo && (
				<Text style={styles.parent} numberOfLines={1}>
					<Text style={styles.parentAuthor}>{`${event.replyTo.author.name}: `}</Text>
					{event.replyTo.text}
				</Text>
			)}

			<InlineMessage message={event.message} isReply={event.replyTo !== undefined} />
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		paddingHorizontal: 12,
		paddingVertical: 3,
	},

	parent: {
		color: Colors.mutedText,
		fontSize: 12,
		marginLeft: 8,
	},

	parentAuthor: {
		fontWeight: "bold",
	},
});
