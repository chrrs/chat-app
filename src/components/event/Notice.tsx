import { StyleSheet, Text, View } from "react-native";
import { InlineMessage } from "./InlineMessage";
import { Colors } from "@/lib/constants/Colors";
import type { ChatEvent } from "@/lib/twitch/event";

interface Props {
	event: ChatEvent.Notice;
}

export const Notice = ({ event }: Props) => {
	return (
		<View style={styles.root}>
			<Text style={[styles.title, { marginBottom: event.message ? 2 : 0 }]}>
				{event.text}
			</Text>

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

		marginVertical: 2,
	},

	title: {
		color: Colors.normalText,
		fontWeight: "bold",
	},
});
