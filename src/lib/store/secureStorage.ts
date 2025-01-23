import type { StateStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

export const SecureStorage: StateStorage = {
	getItem: SecureStore.getItemAsync,
	setItem: SecureStore.setItemAsync,
	removeItem: SecureStore.deleteItemAsync,
};
