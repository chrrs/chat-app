import type { ReactNode } from "react";
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
	children: ReactNode;
}

export const KeyboardAvoidingSafeView = ({ children }: Props) => {
	const { height: keyboardHeight } = useAnimatedKeyboard();
	const safeArea = useSafeAreaInsets();

	const wrapperStyle = useAnimatedStyle(() => {
		return {
			marginBottom: Math.max(keyboardHeight.value, safeArea.bottom),
			marginTop: safeArea.top,
			marginLeft: safeArea.left,
			marginRight: safeArea.right,
		};
	});

	return <Animated.View style={wrapperStyle}>{children}</Animated.View>;
};
