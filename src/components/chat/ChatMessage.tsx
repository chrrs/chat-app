import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "@/lib/constants/Colors";
import type { Event } from "@/lib/irc/chat";
import { InlineMessage } from "./InlineMessage";

interface Props {
	event: Event.Message;
	onClickReply?: (id: string) => void;
}

export const ChatMessage = ({ event, onClickReply }: Props) => {
	return (
		<View style={styles.root}>
			{event.replyTo && (
				<TouchableOpacity activeOpacity={0.5} onPress={() => onClickReply?.(event.replyTo!.id)}>
					<Text style={styles.parent} numberOfLines={1}>
						<Text style={styles.parentAuthor}>{`${event.replyTo.author.name}: `}</Text>
						{event.replyTo.text}
					</Text>
				</TouchableOpacity>
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
		color: Colors.text.muted,
		fontSize: 12,
		marginLeft: 8,
	},

	parentAuthor: {
		fontWeight: "bold",
	},
});
