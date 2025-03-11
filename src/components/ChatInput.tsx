import { Colors } from "@/lib/constants/Colors";
import { SendHorizonalIcon } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

interface Props {
	placeholder?: string;
	onSend: (message: string) => void;
}

export const ChatInput = ({ placeholder, onSend }: Props) => {
	const input = useRef<TextInput>(null);
	const [typedMessage, setTypedMessage] = useState("");

	const canSend = typedMessage !== "";

	const send = useCallback(() => {
		if (input.current && canSend) {
			onSend(typedMessage);
			setTypedMessage("");
			input.current.clear();
		}
	}, [typedMessage, canSend, onSend]);

	return (
		<View style={styles.wrapper}>
			<TextInput
				ref={input}
				style={styles.input}
				placeholder={placeholder}
				onChangeText={setTypedMessage}
				onSubmitEditing={send}
				submitBehavior="submit"
				returnKeyType="send"
				enablesReturnKeyAutomatically={true}
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
	);
};

const styles = StyleSheet.create({
	wrapper: {
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
