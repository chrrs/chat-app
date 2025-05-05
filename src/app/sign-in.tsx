import { Button } from "@/components/Button";
import { Colors } from "@/lib/constants/Colors";
import { useTwitchAuth } from "@/lib/store/auth";
import { useQueryClient } from "@tanstack/react-query";
import { ResponseType, makeRedirectUri, useAuthRequest } from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
	authorizationEndpoint: "https://id.twitch.tv/oauth2/authorize",
	tokenEndpoint: "https://id.twitch.tv/oauth2/token",
	revocationEndpoint: "https://id.twitch.tv/oauth2/revoke",
};

// FIXME: Workaround for Twitch not accepting `scheme://redirect`.
const redirectUri = makeRedirectUri();
const proxyRedirectUri = () => `${process.env.EXPO_PUBLIC_REDIRECT_PROXY}#${redirectUri}`;

export default function () {
	const client = useQueryClient();
	const router = useRouter();
	const setToken = useTwitchAuth((state) => state.setToken);

	const [request, _, promptAsync] = useAuthRequest(
		{
			responseType: ResponseType.Token,
			clientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
			redirectUri: proxyRedirectUri(),
			scopes: [
				"chat:read",
				"chat:edit",
				"user:read:chat",
				"user:write:chat",
				"user:read:emotes",
				"user:read:follows",
			],
		},
		discovery,
	);

	async function promptAuth() {
		const result = await promptAsync();
		if (result.type === "success") {
			setToken(result.params.access_token);

			client.invalidateQueries();
			client.clear();

			router.replace("/");
		}
	}

	useEffect(() => {
		WebBrowser.warmUpAsync();
		return () => {
			WebBrowser.coolDownAsync();
		};
	}, []);

	return (
		<SafeAreaView>
			<View style={styles.container}>
				<Text style={{ marginBottom: 32 }}>
					<Text style={{ fontWeight: "bold" }}>Welcome to chat-app!</Text>
					{"\n\n"}
					To use chat-app, you'll need to log in with Twitch! Don't worry, we'll only use your
					account to view chat, and send the messages you send, that's it.
				</Text>

				<Button type="primary" disabled={!request} onPress={promptAuth}>
					Sign in with Twitch
				</Button>

				<Text style={styles.redirectUri}>Redirect URI: {redirectUri}</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 24,
		marginTop: 64,
	},

	redirectUri: {
		marginTop: 8,
		textAlign: "center",
		color: Colors.hiddenText,
	},
});
