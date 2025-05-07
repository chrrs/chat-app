import type { ChatMessage } from "../irc/chat";
import type { ThirdPartyEmote } from "./emotes";

export namespace Segment {
	export interface Text {
		type: "text";
		content: string;
	}

	export interface Emote {
		type: "emote";

		id: string;
		name: string;
		imageUrl: string;
		aspectRatio: number;
	}

	export interface URL {
		type: "url";
		url: string;
	}

	export type All = Text | Emote | URL;
}

type Marker = { start: number; end: number } & (
	| { type: "twitch_emote"; id: string; name: string }
	| { type: "third_party_emote"; emote: ThirdPartyEmote }
	| { type: "url"; url: string }
	| { type: "mention" }
);

const HTTP_PREFIX = "http://";
const HTTPS_PREFIX = "https://";

const URL_REGEX = /\bhttps?:\/\/[^\s]+|www\.[^\s]+\b/g;

const TWITCH_EMOTE_BASE_URL = "https://static-cdn.jtvnw.net/emoticons/v2/";
const EMOTE_SEPARATORS = ["(", ")", "[", "]", '"', "'", ";", ",", ".", " ", "\n", "\t"];

/**
 * Segments a Twitch chat message into different parts: text, emotes, and URLs
 *
 * @param message The chat message object containing text and emotes
 * @param removeFirstMention Whether to remove the first @mention from the segments
 * @param thirdPartyEmotes Optional map of third-party emote names to their data
 * @returns An array of message segments in the correct order
 */
export function segmentMessage(
	message: ChatMessage,
	removeFirstMention: boolean,
	thirdPartyEmotes: Record<string, ThirdPartyEmote>,
): Segment.All[] {
	let { text, emotes } = message;

	// Chatterino adds \U000E0000 to the end of messages to avoid duplicates.
	const suffix = " \u{E0000}";
	if (text.endsWith(suffix)) {
		text = text.slice(0, -suffix.length).trimEnd();
	}

	// Fast path 1: Single Twitch emote message
	if (emotes.length === 1 && emotes[0].start === 0 && emotes[0].end === text.length - 1) {
		const emote = emotes[0];
		return [
			{
				type: "emote",
				id: `twitch/${emote.id}`,
				name: text,
				imageUrl: `${TWITCH_EMOTE_BASE_URL}${emote.id}/default/dark/2.0`,
				aspectRatio: 1,
			},
		];
	}

	// Fast path 2: Single third-party emote
	const hasMention = removeFirstMention && text.startsWith("@");
	if (emotes.length === 0 && !hasMention && thirdPartyEmotes[text]) {
		const emote = thirdPartyEmotes[text];
		return [
			{
				type: "emote",
				id: `third-party/${text}`,
				name: text,
				imageUrl: emote.imageUrl,
				aspectRatio: emote.aspectRatio,
			},
		];
	}

	// Fast path 3: Multiple Twitch emotes with spaces in between.
	const words = text.split(" ");
	if (emotes.length === words.length) {
		const segments: Segment.All[] = [];
		let start = 0;
		let allEmotes = true;

		for (const word of words) {
			const end = start + word.length;
			const emote = emotes.find((e) => e.start === start && e.end + 1 === end);
			if (emote === undefined) {
				allEmotes = false;
				break;
			}

			segments.push({
				type: "emote",
				id: `twitch/${emote.id}`,
				name: word,
				imageUrl: `${TWITCH_EMOTE_BASE_URL}${emote.id}/default/dark/2.0`,
				aspectRatio: 1,
			});

			if (start !== 0) segments.push({ type: "text", content: " " });
			start += word.length + 1;
		}

		if (allEmotes) return segments;
	}

	// Fast path 4: Multiple third-party emotes with spaces in between
	const anyThirdPartyEmotes = Object.keys(thirdPartyEmotes).length > 0;
	const mayContainUrl = text.indexOf(HTTP_PREFIX) !== -1 || text.indexOf(HTTPS_PREFIX) !== -1;
	if (
		emotes.length === 0 &&
		!hasMention &&
		!mayContainUrl &&
		anyThirdPartyEmotes &&
		text.indexOf(" ") !== -1
	) {
		const allEmotes = words.length > 0 && words.every((word) => word && thirdPartyEmotes[word]);

		if (allEmotes) {
			const segments: Segment.All[] = [];
			for (let i = 0; i < words.length; i++) {
				const word = words[i];
				const emote = thirdPartyEmotes[word];

				segments.push({
					type: "emote",
					id: `third-party/${word}`,
					name: word,
					imageUrl: emote.imageUrl,
					aspectRatio: emote.aspectRatio,
				});

				if (i < words.length - 1) segments.push({ type: "text", content: " " });
			}

			return segments;
		}
	}

	// We've exhausted the fast paths, so we need to do a full scan of the message.
	const markers: Marker[] = [];

	// 1. Mentions - already checked earlier, just create the marker
	if (hasMention) {
		let endOfMention = text.indexOf(" ");
		// If no space, mention is the whole text. end is exclusive.
		endOfMention = endOfMention === -1 ? text.length : endOfMention + 1;
		markers.push({ start: 0, end: endOfMention, type: "mention" });
	}

	// 2. Twitch Emotes
	if (emotes.length > 0) {
		for (const emote of emotes) {
			markers.push({
				start: emote.start,
				end: emote.end + 1,
				type: "twitch_emote",
				id: emote.id,
				name: text.substring(emote.start, emote.end + 1),
			});
		}
	}

	// 3. Third-Party Emotes - only process if we have some
	if (anyThirdPartyEmotes) {
		let start = 0;
		for (let i = 0; i <= text.length; i++) {
			if (i === text.length || EMOTE_SEPARATORS.includes(text[i])) {
				const word = text.substring(start, i);
				const emote = thirdPartyEmotes[word];
				if (emote !== undefined) {
					markers.push({
						start,
						end: i,
						type: "third_party_emote",
						emote,
					});
				}

				start = i + 1;
			}
		}
	}

	// 4. URLs - only process if we detected URL prefixes
	if (mayContainUrl) {
		URL_REGEX.lastIndex = 0;
		let urlMatch = URL_REGEX.exec(text);
		while (urlMatch !== null) {
			markers.push({
				start: urlMatch.index,
				end: urlMatch.index + urlMatch[0].length,
				type: "url",
				url: urlMatch[0],
			});
			urlMatch = URL_REGEX.exec(text);
		}
	}

	// If we don't have any markers, it's a simple case.
	if (markers.length === 0) {
		return [{ type: "text", content: text }];
	}

	if (markers.length > 1) {
		// Sort markers by start position
		markers.sort((a, b) => a.start - b.start);

		// Remove overlapping markers, give precedence to markers that start
		// earlier or are processed first if starts are identical.
		for (let i = 1; i < markers.length; i++) {
			if (markers[i].start < markers[i - 1].end) {
				markers.splice(i, 1);
				i--;
			}
		}
	}

	const segments: Segment.All[] = [];
	let lastPosition = 0;

	for (const marker of markers) {
		// Add text segment for content before this marker
		if (marker.start > lastPosition) {
			segments.push({
				type: "text",
				content: text.substring(lastPosition, marker.start),
			});
		}

		// Add the marked segment (unless it's a mention)
		if (marker.type === "url") {
			segments.push({ type: "url", url: marker.url });
		} else if (marker.type === "twitch_emote") {
			segments.push({
				type: "emote",
				id: `twitch/${marker.id}`,
				name: marker.name,
				imageUrl: `${TWITCH_EMOTE_BASE_URL}${marker.id}/default/dark/2.0`,
				aspectRatio: 1,
			});
		} else if (marker.type === "third_party_emote") {
			segments.push({
				type: "emote",
				id: `third-party/${marker.emote.name}`,
				name: marker.emote.name,
				imageUrl: marker.emote.imageUrl,
				aspectRatio: marker.emote.aspectRatio,
			});
		}

		lastPosition = marker.end;
	}

	// Add text segment for content after the last marker
	if (lastPosition < text.length) {
		segments.push({ type: "text", content: text.substring(lastPosition) });
	}

	return segments;
}
