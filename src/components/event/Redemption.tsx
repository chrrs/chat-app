import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/lib/constants/Colors";
import type { ChatEvent } from "@/lib/twitch/event";

interface Props {
	event: ChatEvent.Redemption;
}

export const Redemption = ({ event }: Props) => {
	return (
		<View style={styles.root}>
			<Text style={styles.title}>
				{event.by.name} redeemed {event.redemption.title} (
				{event.redemption.cost.toLocaleString("en-US")})
			</Text>

			{event.redemption.input && (
				<Text style={styles.input}>{event.redemption.input}</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		borderColor: Colors.redemptionBorder,
		borderLeftWidth: 4,
		borderRightWidth: 4,

		backgroundColor: Colors.redemptionBackground,

		paddingHorizontal: 8,
		paddingVertical: 4,

		marginVertical: 2,
	},

	title: {
		color: Colors.normalText,
		fontWeight: "bold",
	},

	input: {
		color: Colors.normalText,
		marginTop: 2,
	},
});
