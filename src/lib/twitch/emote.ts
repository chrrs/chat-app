import type { ChatMessage, Fragment } from "./event";

export type EmoteInfo = {
	id: string;
	name: string;
	url: string;
};

export type Emotes = Record<string, EmoteInfo>;

export function insertEmotes(
	message: ChatMessage,
	emotes: Emotes,
): ChatMessage {
	return {
		...message,
		fragments: message.fragments.flatMap((fragment) => {
			if (fragment.type !== "text") {
				return [fragment];
			}

			const fragments: Fragment.Any[] = [];

			let i = 0;
			let current = "";
			while (true) {
				const nextSpace = fragment.text.indexOf(" ", i);

				let segment: string;
				if (nextSpace === -1) {
					segment = fragment.text.substring(i);
				} else {
					segment = fragment.text.substring(i, nextSpace);
				}

				const emote = emotes[segment];
				if (emote !== undefined) {
					if (current !== "") {
						fragments.push({ type: "text", text: current });
					}

					fragments.push({ type: "emote", ...emote });
					current = " ";
				} else {
					current += `${segment} `;
				}

				if (nextSpace === -1) {
					if (current !== "") {
						fragments.push({ type: "text", text: current });
					}

					break;
				}

				i = nextSpace + 1;
			}

			return fragments;
		}),
	};
}
