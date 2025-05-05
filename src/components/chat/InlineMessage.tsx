import { Colors } from "@/lib/constants/Colors";
import type { Badge, ChatMessage } from "@/lib/irc/chat";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { useBadges } from "../context/BadgeProvider";

const BadgeImage = ({ badge }: { badge: Badge }) => {
	const badges = useBadges();
	const helixBadge = badges.find((b) => b.id === badge.set)?.getVersion(badge.version);
	const key = `${badge.set}/${badge.version}`;

	return (
		<View style={styles.badgeWrapper}>
			{helixBadge && (
				<Image
					style={styles.badge}
					cachePolicy="memory"
					recyclingKey={key}
					source={helixBadge.getImageUrl(1)}
					alt={helixBadge.title}
				/>
			)}
		</View>
	);
};

interface Props {
	message: ChatMessage;
}

export const InlineMessage = ({ message }: Props) => {
	return (
		<Text style={styles.message}>
			{message.author.badges.map((badge) => (
				<BadgeImage key={badge.set} badge={badge} />
			))}

			<Text style={[styles.name, { color: message.author.color }]}>{message.author.name}:</Text>

			<Text>{` ${message.text}`}</Text>
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
		width: 18 + 4,
	},

	badge: {
		bottom: -3,
		width: 18,
		height: 18,
	},

	emote: {
		bottom: -3,
		height: 20,
	},

	mention: {
		fontWeight: "bold",
	},
});
