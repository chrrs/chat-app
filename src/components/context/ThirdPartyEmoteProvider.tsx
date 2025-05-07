import type { ThirdPartyEmote } from "@/lib/message/emotes";
import React, { useContext } from "react";

const ThirdPartyEmoteContext = React.createContext<Record<string, ThirdPartyEmote> | null>(null);

interface Props {
	emotes: Record<string, ThirdPartyEmote>;
	children: React.ReactNode;
}

export const ThirdPartyEmoteProvider = ({ emotes, children }: Props) => {
	const existingEmotes = useContext(ThirdPartyEmoteContext) ?? {};

	const mergedEmotes = React.useMemo(() => {
		return { ...emotes, ...existingEmotes };
	}, [existingEmotes, emotes]);

	return (
		<ThirdPartyEmoteContext.Provider value={mergedEmotes}>
			{children}
		</ThirdPartyEmoteContext.Provider>
	);
};

export const useThirdPartyEmotes = () => {
	const emotes = useContext(ThirdPartyEmoteContext);
	if (!emotes) {
		throw new Error("useThirdPartyEmotes must be used within a ThirdPartyEmoteProvider");
	}

	return emotes;
};
