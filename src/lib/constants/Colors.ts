import { Platform, PlatformColor } from "react-native";

export const Colors = Platform.select({
	ios: {
		text: {
			normal: PlatformColor("label"),
			muted: PlatformColor("secondaryLabel"),
			hidden: PlatformColor("tertiaryLabel"),
			error: PlatformColor("systemRed"),
			hyperlink: PlatformColor("systemBlue"),
			viewers: PlatformColor("systemRed"),
		},

		background: {
			normal: PlatformColor("systemBackground"),
			primary: PlatformColor("systemPurple"),
			secondary: PlatformColor("secondarySystemBackground"),
			tertiary: PlatformColor("tertiarySystemBackground"),
		},

		notice: {
			border: PlatformColor("systemPurple"),
			background: PlatformColor("systemGray6"),
		},

		delete: {
			background: "#f00",
			foreground: "#fff",
		},

		goToBottom: {
			background: "#f008",
			foreground: "#fff",
		},

		widget: {
			primary: {
				background: PlatformColor("systemPurple"),
				foreground: "#fff",
			},
			secondary: {
				background: PlatformColor("systemGray6"),
				foreground: PlatformColor("label"),
			},
		},
	},
})!;
