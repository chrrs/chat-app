import { type Message, parse } from "tekko";
import {
	type ChatEvent,
	type ChatMessage,
	type Fragment,
	getNameColor,
} from "./event";

let nextId = 0;

type TwitchIrcTags = {
	historical: string;
	"rm-received-ts": string;
	id?: string;
	"user-id": string;
	"display-name": string;
	color?: string;
	badges: string;
	"msg-id"?: string;
	"system-msg"?: string;
	emotes: string;
};

export function parseIrcChatMessage(res: Message<TwitchIrcTags>): ChatMessage {
	if (!res.tags) {
		throw new Error("IRC message has no tags");
	}

	const text = res.params[1];
	const fragments = [] as Fragment.Any[];

	const emoteTags =
		res.tags.emotes?.length > 0 ? res.tags.emotes.split("/") : [];
	const emotes = [] as {
		id: string;
		name: string;
		start: number;
		end: number;
	}[];

	// We need to loop through it once, because emotes can be out-of-order in the
	// tag. For example: 'a:1-2,8-9/b:4-5'.
	for (const emote of emoteTags) {
		const [id, ranges] = emote.split(":", 2);
		for (const range of ranges.split(",")) {
			const parts = range.split("-", 2);
			const [start, end] = [Number(parts[0]), Number(parts[1]) + 1];

			const name = text.substring(start, end);
			emotes.push({ id, name, start, end });
		}
	}

	emotes.sort((a, b) => a.start - b.start);

	// Then, we can actually split our message into fragments.
	let index = 0;
	for (const emote of emotes) {
		if (index < emote.start) {
			fragments.push({
				type: "text",
				text: text.substring(index, emote.start),
			});
		}

		fragments.push({
			type: "emote",
			id: emote.id,
			name: text.substring(emote.start, emote.end),
			url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/light/2.0`,
		});
		index = emote.end;
	}

	// Add the last fragment if there's text left over.
	if (index < text.length) {
		fragments.push({ type: "text", text: text.substring(index) });
	}

	const hasBadges = res.tags.badges && res.tags.badges.length > 0;

	return {
		author: {
			id: res.tags["user-id"],
			login: res.prefix?.user ?? "",
			name: res.tags["display-name"],
			color: getNameColor(res.tags.color ?? ""),
			badges: hasBadges
				? res.tags.badges
						.split(",")
						.map((id) => id.split("/"))
						.map((id) => ({ set: id[0], id: id[1] }))
				: [],
		},
		text,
		fragments,
	};
}

export function parseIrcEvent(msg: string): ChatEvent.Any | null {
	const res = parse<TwitchIrcTags>(msg);
	if (!res.tags) {
		return null;
	}

	const historical = res.tags?.historical === "1";
	const id = res.tags.id ?? `irc-${nextId++}`;
	const timestamp = new Date(Number(res.tags["rm-received-ts"]));

	if (res.command === "PRIVMSG") {
		return {
			type: "message",
			id,
			timestamp,
			historical,
			message: parseIrcChatMessage(res),
		} satisfies ChatEvent.Message;
	}

	if (res.command === "USERNOTICE") {
		return {
			type: "notice",
			id,
			timestamp,
			historical,
			text:
				res.tags["msg-id"] === "announcement"
					? "Announcement"
					: (res.tags["system-msg"] ?? ""),
			message: res.params[1]?.length > 0 ? parseIrcChatMessage(res) : undefined,
		};
	}

	return null;
}
