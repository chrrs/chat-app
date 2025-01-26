import { PlatformColor } from "react-native";

// FIXME: These are all iOS colors.
export const Colors = {
	background: PlatformColor("systemBackground"),
	normalText: PlatformColor("label"),
	mutedText: PlatformColor("secondaryLabel"),
	accentColor: PlatformColor("systemPurple"),

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
};
