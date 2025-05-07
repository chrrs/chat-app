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

const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/g;

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
	const { text, emotes } = message;

	type Marker = { start: number; end: number } & (
		| { type: "twitch_emote"; id: string; name: string }
		| { type: "third_party_emote"; name: string }
		| { type: "url"; url: string }
		| { type: "mention" }
	);

	const markers: Marker[] = [];

	// 1. Mentions
	if (removeFirstMention && text.startsWith("@")) {
		let endOfMention = text.indexOf(" ");
		// If no space, mention is the whole text. end is exclusive.
		endOfMention = endOfMention === -1 ? text.length : endOfMention + 1;
		markers.push({ start: 0, end: endOfMention, type: "mention" });
	}

	// 2. Twitch Emotes
	for (const emote of emotes) {
		markers.push({
			start: emote.start,
			end: emote.end + 1,
			type: "twitch_emote",
			id: emote.id,
			name: text.substring(emote.start, emote.end + 1),
		});
	}

	// 3. URLs
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

	// 4. Third-Party Emotes
	let position = 0;
	const words = text.split(/[\(\)\[\]"'`;,. \n\t]/);
	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		if (thirdPartyEmotes[word]) {
			markers.push({
				start: position,
				end: position + word.length,
				type: "third_party_emote",
				name: word,
			});
		}

		position += word.length + 1;
	}

	// If we don't have any markers, it's a simple case.
	if (markers.length === 0) {
		return [{ type: "text", content: text }];
	}

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
				imageUrl: getTwitchEmoteUrl(marker.id),
				aspectRatio: 1,
			});
		} else if (marker.type === "third_party_emote") {
			if (thirdPartyEmotes?.[marker.name]) {
				const emoteData = thirdPartyEmotes[marker.name];
				segments.push({
					type: "emote",
					id: `third-party/${marker.name}`,
					name: marker.name,
					imageUrl: emoteData.imageUrl,
					aspectRatio: emoteData.aspectRatio,
				});
			}
		}

		lastPosition = marker.end;
	}

	// Add text segment for content after the last marker
	if (lastPosition < text.length) {
		segments.push({ type: "text", content: text.substring(lastPosition) });
	}

	return segments;
}

function getTwitchEmoteUrl(emoteId: string): string {
	const baseUrl = "https://static-cdn.jtvnw.net/emoticons/v2/";
	return `${baseUrl}${emoteId}/default/dark/2.0`;
}
