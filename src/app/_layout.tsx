import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Colors } from "@/lib/constants/Colors";
import { useTwitchAuth } from "@/lib/store/auth";
import { AuthSpinner } from "@/components/auth/AuthSpinner";
import { AuthScreen } from "@/components/auth/AuthScreen";

export default function () {
	const { status, token, setToken } = useTwitchAuth();

	if (status !== "ready") {
		return <AuthSpinner />;
	}

	if (token === null) {
		return <AuthScreen onToken={setToken} />;
	}

	return (
		<View style={styles.container}>
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: Colors.background },
				}}
			>
				<Stack.Screen name="index" />
				<Stack.Screen name="chat/[login]" />
			</Stack>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		height: "100%",
	},
});
