import { Colors } from "@/lib/constants/Colors";
import {
	ResponseType,
	makeRedirectUri,
	useAuthRequest,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
	authorizationEndpoint: "https://id.twitch.tv/oauth2/authorize",
	tokenEndpoint: "https://id.twitch.tv/oauth2/token",
	revocationEndpoint: "https://id.twitch.tv/oauth2/revoke",
};

// FIXME: Workaround for Twitch not accepting `scheme://redirect`.
const redirectUri = makeRedirectUri();
const getRedirectUri = () =>
	`${process.env.EXPO_PUBLIC_REDIRECT_PROXY}#${redirectUri}`;

interface Props {
	onToken: (token: string) => void;
}

export const AuthScreen = ({ onToken }: Props) => {
	const [request, response, promptAsync] = useAuthRequest(
		{
			responseType: ResponseType.Token,
			clientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
			redirectUri: getRedirectUri(),
			scopes: [
				"user:read:chat",
				"user:write:chat",
				"channel:read:redemptions",
				"channel:read:hype_train",
				"channel:read:polls",
			],
		},
		discovery,
	);

	useEffect(() => {
		if (response?.type === "success") {
			onToken(response.params.access_token);
		}
	}, [response, onToken]);

	useEffect(() => {
		WebBrowser.warmUpAsync();
		return () => {
			WebBrowser.coolDownAsync();
		};
	}, []);

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.root}>
				<Text style={styles.title}>Welcome!</Text>
				<Text style={styles.subtitle}>
					To use chat-app, you'll need to log in with Twitch!
				</Text>
				<Button
					title="Log in with Twitch"
					color={Colors.accentColor}
					disabled={!request}
					onPress={() => promptAsync()}
				/>
				<Text style={styles.redirectUri}>Redirect URI: {redirectUri}</Text>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		backgroundColor: Colors.background,
	},

	root: {
		display: "flex",
		justifyContent: "center",

		paddingHorizontal: 16,
		height: "100%",
	},

	title: {
		color: Colors.normalText,
		fontSize: 24,
		fontWeight: "bold",
	},

	subtitle: {
		color: Colors.normalText,
		marginTop: 4,
		marginBottom: 32,
	},

	redirectUri: {
		marginTop: 48,
		textAlign: "center",
		color: Colors.hiddenText,
	},
});
