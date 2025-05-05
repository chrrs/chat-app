import type { HelixChatBadgeSet } from "@twurple/api";
import React, { useContext } from "react";

const BadgeContext = React.createContext<HelixChatBadgeSet[] | null>(null);

interface Props {
	badges: HelixChatBadgeSet[];
	children: React.ReactNode;
}

export const BadgeProvider = ({ badges, children }: Props) => {
	const existingBadges = useContext(BadgeContext) ?? [];

	const mergedBadges = React.useMemo(() => {
		return [...badges, ...existingBadges];
	}, [existingBadges, badges]);

	return <BadgeContext.Provider value={mergedBadges}>{children}</BadgeContext.Provider>;
};

export const useBadges = () => {
	const badges = useContext(BadgeContext);
	if (!badges) {
		throw new Error("useBadges must be used within a BadgeProvider");
	}

	return badges;
};
