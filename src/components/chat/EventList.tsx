import { Colors } from "@/lib/constants/Colors";
import type { Event } from "@/lib/irc/chat";
import { FlashList } from "@shopify/flash-list";
import { useEffect, useRef, useState } from "react";
import {
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	type StyleProp,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	type ViewStyle,
} from "react-native";
import { ChatMessage } from "./ChatMessage";
import { SystemMessage } from "./SystemMessage";
import { UserNotice } from "./UserNotice";

interface Props {
	style?: StyleProp<ViewStyle>;
	events: Event.All[];
}

export const EventList = ({ style, events }: Props) => {
	const list = useRef<FlashList<Event.All>>(null);
	const [shownEvents, setShownEvents] = useState(events.toReversed());
	const [atBottom, setAtBottom] = useState(true);

	useEffect(() => {
		if (atBottom) {
			setShownEvents(events.toReversed());
		}
	}, [events, atBottom]);

	function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
		setAtBottom(event.nativeEvent.contentOffset.y < 10);
	}

	function scrollToBottom() {
		list.current?.scrollToIndex({ index: 0 });
		setAtBottom(true);
	}

	return (
		<View style={style}>
			<FlashList
				ref={list}
				data={shownEvents}
				estimatedItemSize={17}
				inverted={true}
				onScroll={onScroll}
				keyExtractor={(item) => item.id}
				getItemType={(item) => item.type}
				renderItem={({ item }) => (
					<View style={{ opacity: (item.historical ? 0.6 : 1.0) * (item.deleted ? 0.3 : 1.0) }}>
						{item.type === "message" ? (
							<ChatMessage event={item} />
						) : item.type === "usernotice" ? (
							<UserNotice event={item} />
						) : (
							<SystemMessage event={item} />
						)}
					</View>
				)}
			/>

			{!atBottom && (
				<TouchableOpacity style={styles.bottomButton} onPress={scrollToBottom} activeOpacity={0.5}>
					<Text style={styles.bottomText}>More messages below...</Text>
				</TouchableOpacity>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	bottomButton: {
		position: "absolute",
		width: "100%",
		bottom: 0,

		paddingVertical: 4,

		backgroundColor: Colors.bottomButtonBackground,
	},

	bottomText: {
		color: Colors.bottomButtonText,
		textAlign: "center",
	},
});
