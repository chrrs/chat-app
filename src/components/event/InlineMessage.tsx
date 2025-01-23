import { Colors } from "@/lib/constants/Colors";
import type { BadgeIdentifier, ChatMessage } from "@/lib/twitch/event";
import { Image, StyleSheet, Text, View } from "react-native";
import { useBadges } from "../BadgeProvider";

interface Props {
	message: ChatMessage;
}

const Badge = ({ badge }: { badge: BadgeIdentifier }) => {
	const badges = useBadges();
	const key = `${badge.set}/${badge.id}`;

	const info = badges[key];

	return (
		<View style={styles.badgeWrapper}>
			{info ? (
				<Image style={styles.badge} src={info.image} alt={info.title} />
			) : (
				<View
					style={{
						...styles.badge,
						backgroundColor: Colors.mutedText,
						opacity: 0.3,
					}}
				/>
			)}
		</View>
	);
};

export const InlineMessage = ({ message }: Props) => {
	return (
		<Text style={styles.message}>
			{message.author.badges.map((badge) => (
				<Badge key={`${badge.set}/${badge.id}`} badge={badge} />
			))}

			<Text style={[styles.name, { color: message.author.color }]}>
				{message.author.name}:
			</Text>

			{` ${message.text}`}
		</Text>
	);
};

const styles = StyleSheet.create({
	message: {
		color: Colors.normalText,
	},

	name: {
		fontWeight: "bold",
	},

	badgeWrapper: {
		width: 16 + 3,
	},

	badge: {
		bottom: -3,
		width: 16,
		height: 16,
	},
});
