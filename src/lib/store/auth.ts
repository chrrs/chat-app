import { ApiClient } from "@twurple/api";
import { type AuthProvider, getTokenInfo, StaticAuthProvider, type TokenInfo } from "@twurple/auth";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { TwitchIrcClient } from "../irc/client";
import { SecureStorage } from "./storage";

type Status = "hydrating" | "authenticating" | "ready";

interface Session {
	userId: string;
	login: string | null;

	authProvider: AuthProvider;
	apiClient: ApiClient;
	ircClient: TwitchIrcClient;
}

interface TwitchAuthStore {
	setToken: (token: string | null) => void;
	revalidate: () => Promise<void>;
	signOut: () => void;

	status: Status;
	token: string | null;
	session: Session | null;
}

function createSession(token: string, info: TokenInfo): Session {
	const clientId = process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID;
	const authProvider = new StaticAuthProvider(clientId, token);
	const apiClient = new ApiClient({ authProvider });
	const ircClient = new TwitchIrcClient(authProvider);

	return {
		userId: info.userId ?? "unknown",
		login: info.userName,

		authProvider,
		apiClient,
		ircClient,
	};
}

export const useTwitchAuth = create<TwitchAuthStore>()(
	persist(
		(set, get) => ({
			setToken: (token) => {
				set({ token });
				get().revalidate();
			},

			revalidate: async () => {
				const token = get().token;
				if (token === null) {
					console.warn("no token, skipping revalidation");
					set({ status: "ready", session: null });
					return;
				}

				set({ status: "authenticating" });

				getTokenInfo(token)
					.then((info) => {
						set({ status: "ready", session: createSession(token, info) });
					})
					.catch((error) => {
						console.warn("failed to validate token:", error);
						set({ status: "ready", session: null });
					});
			},

			signOut: () => {
				set({ token: null, session: null });
			},

			status: "hydrating",
			token: null,
			session: null,
		}),
		{
			name: "twitch_auth",
			storage: createJSONStorage(() => SecureStorage),
			partialize: (state) => ({ token: state.token }),
			onRehydrateStorage: () => (state) => {
				state?.revalidate();
			},
		},
	),
);
