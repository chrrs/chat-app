import { TwitchClient } from "../twitch/client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SecureStorage } from "./secureStorage";

type Status = "hydrating" | "authenticating" | "ready";

interface TwitchAuthStore {
	setToken: (token: string | null) => void;
	revalidate: () => Promise<void>;
	logout: () => void;

	status: Status;
	token: string | null;
	client: TwitchClient | null;
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
				if (token !== null) {
					set({ status: "authenticating" });
					await TwitchClient.authenticate(token)
						.then((client) => {
							if (client === null) set({ token: null });
							else set({ client });
						})
						.then(() => set({ status: "ready" }));
				} else {
					set({ status: "ready" });
				}
			},

			logout: () => {
				set({ token: null, client: null });
			},

			status: "hydrating",
			token: null,
			client: null,
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
