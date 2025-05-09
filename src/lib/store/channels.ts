import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AsyncStorage } from "./storage";

interface ChannelsStore {
	channels: string[];
	getChannels(): string[];
	addChannel: (channel: string) => void;
	removeChannel: (channel: string) => void;
}

export const useChannels = create<ChannelsStore>()(
	persist(
		(set, get) => ({
			channels: [],
			getChannels: () => get().channels,
			addChannel: (channel: string) => {
				const normalizedChannel = channel.toLowerCase();
				if (!get().channels.includes(normalizedChannel)) {
					set((state) => ({ channels: [...state.channels, normalizedChannel] }));
				}
			},
			removeChannel: (channel: string) => {
				const normalizedChannel = channel.toLowerCase();
				set((state) => ({ channels: state.channels.filter((c) => c !== normalizedChannel) }));
			},
		}),
		{
			name: "channels",
			storage: createJSONStorage(() => AsyncStorage),
			partialize: (state) => ({ channels: state.channels }),
		},
	),
);
