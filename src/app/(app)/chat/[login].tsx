import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeftIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { CenteredError } from "@/components/CenteredError";
import { CenteredSpinner } from "@/components/CenteredSpinner";
import { Chat } from "@/components/chat/Chat";
import { Header } from "@/components/Header";
import { KeyboardAvoidingSafeView } from "@/components/KeyboardAvoidingSafeView";
import { IconButton } from "@/components/ui/IconButton";
import { useTwitchAuth } from "@/lib/store/auth";

export default function () {
	const router = useRouter();
	const { login, displayName } = useLocalSearchParams<{ login: string; displayName?: string }>();

	const session = useTwitchAuth((state) => state.session);

	const user = useQuery({
		queryKey: ["user", login],
		queryFn: () => session!.apiClient.users.getUserByName(login),
	});

	return (
		<KeyboardAvoidingSafeView>
			<View style={styles.root}>
				<Header
					left={<IconButton icon={ChevronLeftIcon} onPress={router.back} />}
					title={user.data?.displayName ?? displayName ?? login}
				/>

				{user.status === "pending" ? (
					<View style={styles.state}>
						<CenteredSpinner text="Fetching user data..." />
					</View>
				) : user.status === "error" || user.data === null ? (
					<View style={styles.state}>
						<CenteredError text="Couldn't join channel." />
					</View>
				) : (
					<Chat style={styles.state} user={user.data} />
				)}
			</View>
		</KeyboardAvoidingSafeView>
	);
}

const styles = StyleSheet.create({
	root: {
		width: "100%",
		height: "100%",
	},

	state: {
		flex: 1,
	},
});
