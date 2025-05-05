import { Colors } from "@/lib/constants/Colors";
import type { Event } from "@/lib/irc/chat";
import { StyleSheet, Text } from "react-native";

interface Props {
	event: Event.SystemMessage;
}

export const SystemMessage = ({ event }: Props) => {
	return <Text style={styles.message}>{event.text}</Text>;
};

const styles = StyleSheet.create({
	message: {
		color: Colors.mutedText,

		paddingHorizontal: 12,
		paddingVertical: 3,
	},
});
