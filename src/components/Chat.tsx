import { Colors } from "@/lib/constants/Colors";
import type { Channel } from "@/lib/twitch/channel";
import type { ChatEvent } from "@/lib/twitch/event";
import { eMsg } from "@/lib/util";
import { SendHorizonalIcon } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	type StyleProp,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
	type ViewStyle,
} from "react-native";
import { BadgeProvider, type Badges } from "./BadgeProvider";
import { EventList } from "./event/EventList";

interface Props {
	style?: StyleProp<ViewStyle>;
	channel: Channel;
}

export const Chat = ({ style, channel }: Props) => {
	const input = useRef<TextInput>(null);
	const [typedMessage, setTypedMessage] = useState("");

	const [events, setEvents] = useState([] as ChatEvent.Any[]);
	const [channelBadges, setChannelBadges] = useState({} as Badges);

	const canSend = typedMessage !== "";

	const sendChatMessage = useCallback(() => {
		if (channel && input.current && canSend) {
			channel
				.sendMessage(typedMessage)
				.catch((err) =>
					channel?.addSystemMessage(
						`Could not fetch channel badges: ${eMsg(err)}`,
					),
				);

			setTypedMessage("");
			input.current.clear();
		}
	}, [channel, typedMessage, canSend]);

	useEffect(() => {
		setEvents([]);
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
			<View style={[styles.root, style]}>
				<EventList style={styles.events} events={events} />
				<View style={styles.inputWrapper}>
					<TextInput
						ref={input}
						style={styles.input}
						placeholder={`Send message to ${channel.info.name}...`}
						onChangeText={setTypedMessage}
						onSubmitEditing={sendChatMessage}
						submitBehavior="submit"
						returnKeyType="send"
						enablesReturnKeyAutomatically={true}
					/>

					<TouchableOpacity
						style={styles.sendButton}
						onPress={sendChatMessage}
						disabled={!canSend}
					>
						<SendHorizonalIcon
							color={canSend ? Colors.normalText : Colors.hiddenText}
						/>
					</TouchableOpacity>
				</View>
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

	inputWrapper: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		margin: 8,
	},

	input: {
		flexGrow: 1,
		color: Colors.normalText,
		backgroundColor: Colors.inputBackground,
		borderRadius: 8,
		padding: 8,
	},

	sendButton: {
		paddingHorizontal: 8,
	},
});
