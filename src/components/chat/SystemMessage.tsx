import { StyleSheet, Text } from "react-native";
import { Colors } from "@/lib/constants/Colors";
import type { Event } from "@/lib/irc/chat";

interface Props {
	event: Event.SystemMessage;
}

export const SystemMessage = ({ event }: Props) => {
	return <Text style={styles.message}>{event.text}</Text>;
};

const styles = StyleSheet.create({
	message: {
		color: Colors.text.muted,

		paddingHorizontal: 12,
		paddingVertical: 3,
	},
});
