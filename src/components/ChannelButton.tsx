import { Colors } from "@/lib/constants/Colors";
import type { StreamInfo } from "@/lib/twitch/client";
import { Link } from "expo-router";
import { User } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
	login: string;
	info?: StreamInfo;
}

export const ChannelButton = ({ login, info }: Props) => {
	return (
		<Link key={login} href={`/chat/${login}`} asChild>
			<Pressable style={styles.pressable}>
				<View style={styles.header}>
					<Text style={styles.name}>{info ? info.name : login}</Text>

					{info?.stream && (
						<View style={styles.viewersWrapper}>
							<Text style={{ color: Colors.viewersText }}>
								{info.stream.viewers.toLocaleString("en-US")}
							</Text>
							<User size={16} color={Colors.viewersText} />
						</View>
					)}
				</View>

				{info?.stream ? (
					<Text numberOfLines={2} style={styles.title}>
						{info.stream.title}
					</Text>
				) : (
					<Text style={{ color: Colors.mutedText }}>offline</Text>
				)}
			</Pressable>
		</Link>
	);
};

const styles = StyleSheet.create({
	pressable: {
		paddingHorizontal: 16,
		paddingVertical: 12,

		borderBottomWidth: 1,
		borderBottomColor: Colors.secondaryButtonBackground,
	},

	header: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-between",
	},

	viewersWrapper: {
		display: "flex",
		flexDirection: "row",
		gap: 2,
	},

	name: {
		color: Colors.normalText,
		fontWeight: "bold",
		marginBottom: 4,
	},

	title: {
		color: Colors.normalText,
	},
});
