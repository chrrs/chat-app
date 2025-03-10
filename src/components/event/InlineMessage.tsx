import { Colors } from "@/lib/constants/Colors";
import { insertEmotes } from "@/lib/twitch/emote";
import type {
	BadgeIdentifier,
	ChatMessage,
	Fragment,
} from "@/lib/twitch/event";
import { Image } from "expo-image";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useBadges } from "../BadgeProvider";
import { useEmotes } from "../emotes/EmoteProvider";

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
				<Image
					style={styles.badge}
					cachePolicy="memory"
					recyclingKey={key}
					source={info.url}
					alt={info.title}
				/>
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

const Emote = ({ emote }: { emote: Fragment.Emote }) => {
	return (
		<View>
			<Image
				style={[styles.emote, { width: 20 * emote.aspect }]}
				cachePolicy="memory"
				recyclingKey={emote.id}
				source={emote.url}
				alt={emote.name}
			/>
		</View>
	);
};

export const InlineMessage = ({ message }: Props) => {
	const emotes = useEmotes();

	const processedMessage = useMemo(
		() => insertEmotes(message, emotes),
		[message, emotes],
	);

	return (
		<Text style={styles.message}>
			{processedMessage.author.badges.map((badge, index) => (
				<Badge key={index} badge={badge} />
			))}
			<Text style={[styles.name, { color: processedMessage.author.color }]}>
				{processedMessage.author.name}:
			</Text>

			<Text>
				{" "}
				{processedMessage.fragments.map((fragment, index) =>
					fragment.type === "emote" ? (
						<Emote key={index} emote={fragment} />
					) : fragment.type === "mention" ? (
						<Text key={index} style={styles.mention}>
							{fragment.text}
						</Text>
					) : (
						<Text key={index}>{fragment.text}</Text>
					),
				)}
			</Text>
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
