import * as SecureStore from "expo-secure-store";
import type { StateStorage } from "zustand/middleware";

export const SecureStorage: StateStorage = {
	getItem: SecureStore.getItemAsync,
	setItem: SecureStore.setItemAsync,
	removeItem: SecureStore.deleteItemAsync,
};
