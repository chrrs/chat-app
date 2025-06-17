import { useQueryClient } from "@tanstack/react-query";
import { makeRedirectUri, ResponseType, useAuthRequest } from "expo-auth-session";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/lib/constants/Colors";
import { useTwitchAuth } from "@/lib/store/auth";

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
				"user:read:chat",
				"user:write:chat",
				"user:read:emotes",
				"user:read:follows",
			],
		},
		discovery,
	);

	const finishAuth = useCallback(
		(token: string) => {
			setToken(token);
			client.invalidateQueries();
			client.clear();
			router.replace("/");
		},
		[setToken, client, router],
	);

	// Workaround for https://github.com/expo/expo/issues/23781.
	if (Platform.OS === "android") {
		// biome-ignore lint/correctness/useHookAtTopLevel: Platform.OS is constant.
		const url = Linking.useURL();

		// biome-ignore lint/correctness/useHookAtTopLevel: Platform.OS is constant.
		useEffect(() => {
			if (!url) return;

			const hash = new URL(url).hash;
			if (!hash.startsWith("#access_token=")) return;
			const token = hash.substring("&access_token=".length).split("&", 2)[0];
			if (!token) return;

			finishAuth(token);
		}, [url, finishAuth]);
	}

	const promptAuth = useCallback(async () => {
		const result = await promptAsync({ showInRecents: true });
		if (result.type === "success") {
			finishAuth(result.params.access_token);
		}
	}, [promptAsync, finishAuth]);

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
		color: Colors.text.hidden,
	},
});
