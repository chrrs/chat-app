import { Image } from "expo-image";
import { Link } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/lib/constants/Colors";
import type { Badge, ChatMessage } from "@/lib/irc/chat";
import type { Segment } from "@/lib/message/segmenter";
import { segmentMessage } from "@/lib/message/segmenter";
import { useBadges } from "../context/BadgeProvider";
import { useThirdPartyEmotes } from "../context/ThirdPartyEmoteProvider";

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
					source={helixBadge.getImageUrl(2)}
					alt={helixBadge.title}
				/>
			)}
		</View>
	);
};

const Emote = ({ emote }: { emote: Segment.Emote }) => {
	return (
		<View>
			<Image
				style={[styles.emote, { width: 20 * emote.aspectRatio }]}
				cachePolicy="memory"
				recyclingKey={emote.id}
				source={emote.imageUrl}
				alt={emote.name}
			/>
		</View>
	);
};

const Hyperlink = ({ url }: { url: string }) => {
	return (
		<Link style={styles.url} href={url}>
			{url}
		</Link>
	);
};

interface Props {
	message: ChatMessage;
	isReply?: boolean;
}

export const InlineMessage = ({ message, isReply }: Props) => {
	const emotes = useThirdPartyEmotes();

	const segments = useMemo(
		() => segmentMessage(message, isReply ?? false, emotes),
		[message, isReply, emotes],
	);

	return (
		<Text style={styles.message}>
			<Link
				href={{
					pathname: "/user/[login]",
					params: { login: message.author.login, channel: message.channel.login },
				}}
			>
				{message.author.badges.map((badge) => (
					<BadgeImage key={badge.set} badge={badge} />
				))}
				<Text style={[styles.name, { color: message.author.color }]}>{message.author.name}:</Text>
			</Link>
			{/* Space between name and message */}{" "}
			{segments.map((segment, index) =>
				segment.type === "emote" ? (
					<Emote key={index} emote={segment} />
				) : segment.type === "url" ? (
					<Hyperlink key={index} url={segment.url} />
				) : (
					<Text key={index}>{segment.content}</Text>
				),
			)}
		</Text>
	);
};

const styles = StyleSheet.create({
	message: {
		color: Colors.text.normal,
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

	url: {
		color: Colors.text.hyperlink,
		textDecorationLine: "underline",
	},
});
