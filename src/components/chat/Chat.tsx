import { useChat } from "@/lib/irc/chat";
import { useTwitchAuth } from "@/lib/store/auth";
import { useQuery } from "@tanstack/react-query";
import type { HelixUser } from "@twurple/api";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { BadgeProvider } from "../context/BadgeProvider";
import { EventList } from "./EventList";

interface Props {
	user: HelixUser;
	style: StyleProp<ViewStyle>;
}

export const Chat = ({ user, style }: Props) => {
	const session = useTwitchAuth((state) => state.session);
	const { events } = useChat(user.name);

	const channelBadges = useQuery({
		queryKey: ["badges", "channel", user.id],
		queryFn: async () => await session!.apiClient.chat.getChannelBadges(user),
	});

	return (
		<BadgeProvider badges={channelBadges.data ?? []}>
			<View style={style}>
				<EventList style={styles.events} events={events} />
			</View>
		</BadgeProvider>
	);
};

const styles = StyleSheet.create({
	events: {
		flex: 1,
	},
});
