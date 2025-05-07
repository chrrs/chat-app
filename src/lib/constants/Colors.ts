import { Platform, PlatformColor } from "react-native";

export const Colors = Platform.select({
	ios: {
		background: PlatformColor("systemBackground"),
		normalText: PlatformColor("label"),
		mutedText: PlatformColor("secondaryLabel"),
		accentColor: PlatformColor("systemPurple"),

		primaryBackground: PlatformColor("systemPurple"),
		secondaryBackground: PlatformColor("systemGray6"),

		errorText: PlatformColor("systemRed"),
		hyperlink: PlatformColor("systemBlue"),

		viewersText: PlatformColor("systemRed"),

		noticeBorder: PlatformColor("systemPurple"),
		noticeBackground: PlatformColor("systemGray6"),

		redemptionBorder: PlatformColor("systemBlue"),
		redemptionBackground: PlatformColor("systemGray6"),

		inputBackground: PlatformColor("systemGray6"),
		secondaryButtonBackground: PlatformColor("systemGray6"),

		bottomButtonBackground: "#f008",
		bottomButtonText: "#fff",

		hiddenText: PlatformColor("tertiaryLabel"),
	},
	android: {
		background: "#000",
		normalText: "#fff",
		mutedText: "#999",
		accentColor: "#bb86fc",

		primaryBackground: "#bb86fc",
		secondaryBackground: "#222",

		errorText: "#cf6679",
		hyperlink: "#03dac5",

		viewersText: "#f54",

		noticeBorder: "#bb86fc",
		noticeBackground: "#222",

		redemptionBorder: "#03dac5",
		redemptionBackground: "#222",

		inputBackground: "#222",
		secondaryButtonBackground: "#222",

		bottomButtonBackground: "#f008",
		bottomButtonText: "#fff",

		hiddenText: "#666",
	},
})!;
