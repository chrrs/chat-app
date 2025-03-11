import { Colors } from "@/lib/constants/Colors";
import { useTwitchAuth } from "@/lib/store/auth";
import type { Emotes } from "@/lib/twitch/emote";
import { Image } from "expo-image";
import { SendHorizonalIcon } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useEmotes } from "./emotes/EmoteProvider";

interface Props {
	placeholder?: string;
	onSend: (message: string) => void;
}

export const ChatInput = ({ placeholder, onSend }: Props) => {
	const client = useTwitchAuth((store) => store.client);

	const input = useRef<TextInput>(null);
	const [typedMessage, setTypedMessage] = useState("");
	const canSend = typedMessage !== "";

	// biome-ignore lint/style/noNonNullAssertion: last element always exists.
	const lastWord = typedMessage.split(" ").at(-1)!;

	const emotes = useEmotes();
	const [twitchEmotes, setTwitchEmotes] = useState({} as Emotes);
	const showCompletion = lastWord.length >= 2;

	// We show all emotes containing the last word typed, and sort them
	// based on how early that term occurs in the emote.
	const matchingEmotes = useMemo(() => {
		const query = lastWord.toLowerCase();
		const allEmotes = Object.values({ ...emotes, ...twitchEmotes });

		return allEmotes
			.map((emote) => ({
				emote,
				index: emote.name.toLowerCase().indexOf(query),
			}))
			.filter(({ index }) => index !== -1)
			.sort((a, b) => a.index - b.index)
			.map(({ emote }) => emote);
	}, [lastWord, emotes, twitchEmotes]);

	useEffect(() => {
		client?.getUsableEmotes().then(setTwitchEmotes);
	}, [client]);

	useEffect(() => console.log(twitchEmotes), [twitchEmotes]);

	const send = useCallback(() => {
		if (input.current && canSend) {
			onSend(typedMessage);
			setTypedMessage("");
		}
	}, [typedMessage, canSend, onSend]);

	const completeEmote = useCallback((name: string) => {
		setTypedMessage((message) => {
			const lastIndex = message.lastIndexOf(" ");
			const before = message.substring(0, lastIndex === -1 ? 0 : lastIndex + 1);
			return `${before}${name} `;
		});
	}, []);

	return (
		<View style={styles.wrapper}>
			{showCompletion ? (
				<View style={styles.completion}>
					{matchingEmotes.slice(0, 10).map((emote) => (
						<TouchableOpacity
							key={emote.id}
							style={styles.emoteWrapper}
							activeOpacity={0.5}
							onPress={() => completeEmote(emote.name)}
						>
							<Image
								style={{ width: 36 * emote.aspect, height: 36 }}
								source={emote.url}
							/>
						</TouchableOpacity>
					))}
				</View>
			) : null}

			<View style={styles.root}>
				<TextInput
					ref={input}
					style={styles.input}
					placeholder={placeholder}
					onChangeText={setTypedMessage}
					onSubmitEditing={send}
					submitBehavior="submit"
					returnKeyType="send"
					enablesReturnKeyAutomatically={true}
					value={typedMessage}
				/>

				<TouchableOpacity
					style={styles.button}
					onPress={send}
					disabled={!canSend}
					activeOpacity={0.5}
				>
					<SendHorizonalIcon
						color={canSend ? Colors.normalText : Colors.hiddenText}
					/>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		position: "relative",
	},

	completion: {
		display: "flex",
		flexDirection: "row",
		overflowX: "auto",
		gap: 8,

		position: "absolute",
		width: "100%",
		top: -44,
		height: 44,
		paddingHorizontal: 8,
	},

	emoteWrapper: {
		backgroundColor: Colors.inputBackground,
		borderRadius: 8,
		padding: 4,
	},

	root: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		margin: 8,
	},

	input: {
		flex: 1,
		color: Colors.normalText,
		backgroundColor: Colors.inputBackground,
		borderRadius: 8,
		padding: 8,
	},

	button: {
		paddingHorizontal: 8,
	},
});
