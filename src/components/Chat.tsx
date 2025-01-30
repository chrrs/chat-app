import { Colors } from "@/lib/constants/Colors";
import { useTwitchAuth } from "@/lib/store/auth";
import type { Channel } from "@/lib/twitch/channel";
import type { TwitchClient } from "@/lib/twitch/client";
import type { ChatEvent } from "@/lib/twitch/event";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	type StyleProp,
	StyleSheet,
	TextInput,
	View,
	type ViewStyle,
} from "react-native";
import { BadgeProvider, type Badges } from "./BadgeProvider";
import { EventList } from "./event/EventList";

interface Props {
	style?: StyleProp<ViewStyle>;
	login: string;
}

export const Chat = ({ style, login }: Props) => {
	const client = useTwitchAuth((store) => store.client);

	const input = useRef<TextInput>(null);
	const [typedMessage, setTypedMessage] = useState("");

	const [channel, setChannel] = useState(null as Channel | null);
	const [events, setEvents] = useState([] as ChatEvent.Any[]);
	const [channelBadges, setChannelBadges] = useState({} as Badges);

	const sendChatMessage = useCallback(() => {
		if (channel && input.current) {
			channel
				.send(typedMessage)
				.catch((err) =>
					channel?.addSystemMessage(
						`Failed to fetch channel badges: ${err.message}`,
					),
				);

			input.current.clear();
		}
	}, [channel, typedMessage]);

	useEffect(() => {
		setEvents([]);
		if (client === null) {
			return;
		}

		(async (client: TwitchClient) => {
			const channel = await client.getChannel(login);
			setChannel(channel);

			// Show all incoming events.
			channel.on("event", (event) => {
				setEvents((events) => {
					const updatedEvents = [event, ...events];
					if (updatedEvents.length > 1000) updatedEvents.pop();
					return updatedEvents;
				});
			});

			// Fetch channel badges.
			try {
				const badges = await channel.badges();
				setChannelBadges(badges);
			} catch (err) {
				channel.addSystemMessage(
					// @ts-expect-error: we know 'message' exists here.
					`Failed to fetch channel badges: ${err?.message}`,
				);
			}

			// Fetch historic messages when connecting.
			const fetchHistoricMessages = () =>
				channel.fetchHistoricEvents().then((historicEvents) => {
					setEvents((events) => {
						const updatedEvents = [...historicEvents, ...events].sort(
							(a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
						);
						if (updatedEvents.length > 1000) updatedEvents.pop();
						return updatedEvents;
					});
				});

			channel.on("connected", () => fetchHistoricMessages());

			if (client.eventSub.connected) {
				channel.addSystemMessage("Reusing existing connection to Twitch.");
				fetchHistoricMessages();
			}
		})(client);
	}, [login, client]);

	useEffect(() => () => channel?.close(), [channel]);

	return (
		<BadgeProvider badges={channelBadges}>
			<View style={[styles.root, style]}>
				<EventList style={styles.events} events={events} />
				<TextInput
					ref={input}
					style={styles.input}
					placeholder={`Send message in ${login}...`}
					onChangeText={setTypedMessage}
					onSubmitEditing={sendChatMessage}
					submitBehavior="submit"
					returnKeyType="send"
				/>
			</View>
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

	input: {
		color: Colors.normalText,
		backgroundColor: Colors.inputBackground,
		borderRadius: 8,

		padding: 8,
		margin: 8,
	},
});
