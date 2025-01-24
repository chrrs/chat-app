import { Colors } from "@/lib/constants/Colors";
import type { ChatEvent } from "@/lib/twitch/event";
import { FlashList } from "@shopify/flash-list";
import { useEffect, useRef, useState } from "react";
import {
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	Pressable,
	type StyleProp,
	StyleSheet,
	Text,
	View,
	type ViewStyle,
} from "react-native";
import { ChatMessage } from "./ChatMessage";
import { Notice } from "./Notice";
import { Redemption } from "./Redemption";
import { SystemMessage } from "./SystemMessage";

interface Props {
	style?: StyleProp<ViewStyle>;
	events: ChatEvent.Any[];
}

export const EventList = ({ style, events }: Props) => {
	const list = useRef<FlashList<ChatEvent.Any>>(null);
	const [shownEvents, setShownEvents] = useState(events);
	const [atBottom, setAtBottom] = useState(true);

	useEffect(() => {
		if (atBottom) {
			setShownEvents(events);
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
				renderItem={({ item }) =>
					item.type === "message" ? (
						<ChatMessage event={item} />
					) : item.type === "notice" ? (
						<Notice event={item} />
					) : item.type === "redemption" ? (
						<Redemption event={item} />
					) : (
						<SystemMessage event={item} />
					)
				}
			/>

			{!atBottom && (
				<Pressable style={styles.bottomButton} onPress={scrollToBottom}>
					<Text style={styles.bottomText}>More messages below...</Text>
				</Pressable>
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
