import { createContext, useContext, useMemo } from "react";

export type BadgeInfo = {
	image: string;
	title: string;
	description: string;
};

export type Badges = Record<string, BadgeInfo>;

const BadgeContext = createContext({} as Badges);

export const useBadges = () => useContext(BadgeContext);

interface Props {
	badges: Badges;
	children?: React.ReactNode;
}

export const BadgeProvider = ({ badges, children }: Props) => {
	const parentBadges = useBadges();
	const allBadges = useMemo(
		() => ({ ...parentBadges, ...badges }),
		[parentBadges, badges],
	);

	return (
		<BadgeContext.Provider value={allBadges}>{children}</BadgeContext.Provider>
	);
};
