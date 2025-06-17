import { SendHorizonalIcon } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Colors } from "@/lib/constants/Colors";

interface Props {
	onSend: (message: string) => void;
}

export const ChatInput = ({ onSend }: Props) => {
	const input = useRef<TextInput>(null);
	const [typedMessage, setTypedMessage] = useState("");
	const canSend = typedMessage !== "";

	const send = useCallback(() => {
		if (input.current && canSend) {
			onSend(typedMessage);
			setTypedMessage("");
		}
	}, [typedMessage, canSend, onSend]);

	return (
		<View style={styles.root}>
			<TextInput
				ref={input}
				style={styles.input}
				placeholder="Send message..."
				placeholderTextColor={Colors.text.hidden}
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
				<SendHorizonalIcon color={canSend ? Colors.text.normal : Colors.text.hidden} />
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,

		margin: 8,
	},

	input: {
		flex: 1,
		color: Colors.widget.secondary.foreground,
		backgroundColor: Colors.widget.secondary.background,
		borderRadius: 8,
		padding: 8,
	},

	button: {
		paddingHorizontal: 8,
	},
});
