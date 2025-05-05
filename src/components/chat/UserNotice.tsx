import { Colors } from "@/lib/constants/Colors";
import type { Event } from "@/lib/irc/chat";
import { StyleSheet, Text, View } from "react-native";
import { InlineMessage } from "./InlineMessage";

interface Props {
	event: Event.UserNotice;
}

export const UserNotice = ({ event }: Props) => {
	return (
		<View style={styles.root}>
			<Text style={[styles.title, { marginBottom: event.message ? 2 : 0 }]}>{event.text}</Text>

			{event.message && <InlineMessage message={event.message} />}
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		borderColor: Colors.noticeBorder,
		borderLeftWidth: 4,
		borderRightWidth: 4,

		backgroundColor: Colors.noticeBackground,

		paddingHorizontal: 8,
		paddingVertical: 4,

		marginVertical: 3,
	},

	title: {
		color: Colors.normalText,
		fontWeight: "bold",
	},
});
