import { FollowedButton } from "@/components/FollowedButton";
import { Header } from "@/components/Header";
import { IconButton } from "@/components/ui/IconButton";
import { useTwitchAuth } from "@/lib/store/auth";
import { DoorOpenIcon } from "lucide-react-native";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function () {
	const signOut = useTwitchAuth((state) => state.signOut);

	const trySignOut = () => {
		Alert.alert("Sign out?", "You'll have to log back in with your Twitch account", [
			{ text: "Cancel", style: "cancel" },
			{ text: "Sign out", onPress: signOut, isPreferred: true },
		]);
	};

	return (
		<SafeAreaView edges={["top", "left", "right"]}>
			<View style={styles.root}>
				<Header left={<IconButton icon={DoorOpenIcon} onPress={trySignOut} />} title="Home" />

				<ScrollView style={styles.scroller}>
					<SafeAreaView edges={["bottom"]}>
						<FollowedButton />
					</SafeAreaView>
				</ScrollView>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: {
		width: "100%",
		height: "100%",
	},
	scroller: {
		flex: 1,
	},
});
