import { useQuery } from "@tanstack/react-query";
import type { HelixUser } from "@twurple/api";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { useChat } from "@/lib/irc/chat";
import { fetchChannelEmotes } from "@/lib/message/emotes";
import { useTwitchAuth } from "@/lib/store/auth";
import { ChatInput } from "../ChatInput";
import { BadgeProvider } from "../context/BadgeProvider";
import { ThirdPartyEmoteProvider } from "../context/ThirdPartyEmoteProvider";
import { EventList } from "./EventList";

interface Props {
	user: HelixUser;
	style: StyleProp<ViewStyle>;
}

export const Chat = ({ user, style }: Props) => {
	const session = useTwitchAuth((state) => state.session);
	const { events, sendMessage } = useChat(user);

	const channelBadges = useQuery({
		queryKey: ["badges", "channel", user.id],
		queryFn: async () => await session!.apiClient.chat.getChannelBadges(user),
	});

	const channelEmotes = useQuery({
		queryKey: ["emotes", "channel", user.id],
		queryFn: async () => await fetchChannelEmotes(user),
		gcTime: 0,
	});

	return (
		<BadgeProvider badges={channelBadges.data ?? []}>
			<ThirdPartyEmoteProvider emotes={channelEmotes.data ?? {}}>
				<View style={style}>
					<EventList style={styles.events} events={events} />
					<ChatInput onSend={sendMessage} />
				</View>
			</ThirdPartyEmoteProvider>
		</BadgeProvider>
	);
};

const styles = StyleSheet.create({
	events: {
		flex: 1,
	},
});
