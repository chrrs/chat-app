import { CenteredSpinner } from "@/components/CenteredSpinner";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { Colors } from "@/lib/constants/Colors";
import { useTwitchAuth } from "@/lib/store/auth";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function () {
	const { status, token, setToken } = useTwitchAuth();

	if (status !== "ready") {
		return <CenteredSpinner text="Authenticating..." />;
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
		backgroundColor: Colors.background,
		width: "100%",
		height: "100%",
	},
});
