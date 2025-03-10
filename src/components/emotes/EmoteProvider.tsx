import type { Emotes } from "@/lib/twitch/emote";
import { createContext, useContext, useMemo } from "react";

const EmoteContext = createContext({} as Emotes);

export const useEmotes = () => useContext(EmoteContext);

interface Props {
	emotes: Emotes;
	children?: React.ReactNode;
}

export const EmoteProvider = ({ emotes, children }: Props) => {
	const parentEmotes = useEmotes();
	const allEmotes = useMemo(
		() => ({ ...parentEmotes, ...emotes }),
		[parentEmotes, emotes],
	);

	return (
		<EmoteContext.Provider value={allEmotes}>{children}</EmoteContext.Provider>
	);
};
