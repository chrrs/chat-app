import { Colors } from "@/lib/constants/Colors";
import type { ChatEvent } from "@/lib/twitch/event";
import { StyleSheet, Text } from "react-native";

interface Props {
	event: ChatEvent.System;
}

export const SystemMessage = ({ event }: Props) => {
	return <Text style={styles.message}>{event.text}</Text>;
};

const styles = StyleSheet.create({
	message: {
		color: Colors.mutedText,

		paddingHorizontal: 12,
		paddingVertical: 2,
	},
});
