import * as Haptics from "expo-haptics";
import { TrashIcon } from "lucide-react-native";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
	runOnJS,
	type SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { Colors } from "@/lib/constants/Colors";

interface Props {
	children: React.ReactNode;
	onDelete?: () => void;
}

const RightAction = (_progress: SharedValue<number>, dragX: SharedValue<number>) => {
	const animatedStyle = useAnimatedStyle(() => {
		return {
			opacity: Math.min(1, Math.abs(dragX.value) / 120),
			width: Math.abs(dragX.value),
		};
	});

	return (
		<View style={styles.actionRoot}>
			<Animated.View style={[styles.rightAction, animatedStyle]}>
				<TrashIcon color={Colors.delete.foreground} />
			</Animated.View>
		</View>
	);
};

export const SwipeToDelete = ({ children, onDelete }: Props) => {
	const root = useRef<Animated.View>(null);
	const height = useSharedValue(-1);

	const animatedStyle = useAnimatedStyle(() => ({
		height: height.value === -1 ? undefined : height.value,
		overflow: "hidden",
	}));

	const handleDelete = () => {
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		root.current?.measure((_x, _y, _w, h) => {
			height.value = h;
			height.value = withTiming(0, { duration: 300 }, () => onDelete && runOnJS(onDelete)());
		});
	};

	return (
		<GestureHandlerRootView onMoveShouldSetResponder={() => true}>
			<Animated.View ref={root} style={animatedStyle}>
				<Swipeable
					cancelsTouchesInView={false}
					renderRightActions={RightAction}
					onSwipeableWillOpen={handleDelete}
				>
					{children}
				</Swipeable>
			</Animated.View>
		</GestureHandlerRootView>
	);
};

const styles = StyleSheet.create({
	actionRoot: {
		flexDirection: "row-reverse",
		width: "100%",
	},

	rightAction: {
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: Colors.delete.background,
	},
});
