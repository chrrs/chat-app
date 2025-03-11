import { Colors } from "@/lib/constants/Colors";
import type { Channel } from "@/lib/twitch/channel";
import type { Emotes } from "@/lib/twitch/emote";
import type { ChatEvent } from "@/lib/twitch/event";
import { eMsg } from "@/lib/util";
import { useEffect, useState } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { BadgeProvider, type Badges } from "./BadgeProvider";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { EmoteProvider } from "./emotes/EmoteProvider";
import { EventList } from "./event/EventList";

interface Props {
	style?: StyleProp<ViewStyle>;
	channel: Channel;
}

export const Chat = ({ style, channel }: Props) => {
	const [events, setEvents] = useState([] as ChatEvent.Any[]);
	const [channelBadges, setChannelBadges] = useState({} as Badges);

	const [bttvEmotes, setBttvEmotes] = useState({} as Emotes);
	const [ffzEmotes, setFfzEmotes] = useState({} as Emotes);

	const sendChatMessage = (message: string) =>
		channel
			.sendMessage(message)
			.catch((err) =>
				channel?.addSystemMessage(`Could not send message: ${eMsg(err)}`),
			);

	useEffect(() => {
		setEvents([]);
		setChannelBadges({});
		setBttvEmotes({});

		(async () => {
			const addSystemMessage = (message: string) =>
				channel.addSystemMessage(message);

			// Show all incoming events.
			channel.on("event", (event) => {
				setEvents((events) => {
					const updatedEvents = [event, ...events];
					if (updatedEvents.length > 1000) updatedEvents.pop();
					return updatedEvents;
				});
			});

			if (channel.connected) {
				channel.addSystemMessage("Reusing existing connection to Twitch.");
			}

			// Fetch BTTV & FFZ emotes
			channel
				.fetchBttvEmotes()
				.then(setBttvEmotes)
				.catch((err) =>
					addSystemMessage(`Could not fetch channel BTTV emotes: ${eMsg(err)}`),
				);
			channel
				.fetchFfzEmotes()
				.then(setFfzEmotes)
				.catch((err) =>
					addSystemMessage(`Could not fetch channel FFZ emotes: ${eMsg(err)}`),
				);

			// Fetch channel badges. We await here so the historic messages can
			// use these badges after they're fetched.
			try {
				const badges = await channel.fetchChannelBadges();
				setChannelBadges(badges);
			} catch (err) {
				addSystemMessage(`Could not fetch channel badges: ${eMsg(err)}`);
			}

			// Fetch historic messages when connecting.
			const fetchHistoricMessages = () =>
				channel
					.fetchHistoricEvents()
					.then((historicEvents) => {
						setEvents((events) => {
							const updatedEvents = [...historicEvents, ...events].sort(
								(a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
							);
							if (updatedEvents.length > 1000) updatedEvents.pop();
							return updatedEvents;
						});
					})
					.catch((err) =>
						addSystemMessage(`Could not fetch historic messages: ${eMsg(err)}`),
					);

			channel.on("connected", () => fetchHistoricMessages());
			if (channel.connected) {
				fetchHistoricMessages();
			}
		})();
	}, [channel]);

	return (
		<BadgeProvider badges={channelBadges}>
			<EmoteProvider emotes={{ ...bttvEmotes, ...ffzEmotes }}>
				<View style={[styles.root, style]}>
					<ChatHeader user={channel.info} />
					<EventList style={styles.events} events={events} />
					<ChatInput
						placeholder={`Send message to ${channel.info.name}...`}
						onSend={sendChatMessage}
					/>
				</View>
			</EmoteProvider>
		</BadgeProvider>
	);
};

const styles = StyleSheet.create({
	root: {
		display: "flex",
		height: "100%",
	},

	events: {
		flex: 1,
	},
});
