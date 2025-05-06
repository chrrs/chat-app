import type { ChatMessage } from "./chat";

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
 * @returns An array of message segments in the correct order
 */
export function segmentMessage(message: ChatMessage, removeFirstMention: boolean): Segment.All[] {
	const { text, emotes } = message;

	// If there are no emotes or URLs, just return the whole text as one segment
	if (!removeFirstMention && emotes.length === 0 && !URL_REGEX.test(text)) {
		return [{ type: "text", content: text }];
	}

	// Create an array of markers indicating segment ranges
	type Marker = {
		start: number;
		end: number;
		type: "emote" | "url" | "mention";
		emoteId?: string;
	};

	const markers: Marker[] = [];

	// Remove the first mention if specified
	if (removeFirstMention && text.startsWith("@")) {
		let endOfMention = text.indexOf(" ");
		endOfMention = endOfMention === -1 ? text.length : endOfMention + 1;
		markers.push({ start: 0, end: endOfMention, type: "mention" });
	}

	// Add markers for emotes
	for (const emote of emotes) {
		markers.push({
			start: emote.start,
			end: emote.end + 1,
			type: "emote",
			emoteId: emote.id,
		});
	}

	// Add markers for URLs
	URL_REGEX.lastIndex = 0; // Reset regex state
	let match = URL_REGEX.exec(text);
	while (match !== null) {
		markers.push({
			start: match.index,
			end: match.index + match[0].length,
			type: "url",
		});
		match = URL_REGEX.exec(text);
	}

	// Sort markers by position
	markers.sort((a, b) => a.start - b.start);

	// Remove overlapping markers (if they overlap, remove the last one)
	for (let i = 1; i < markers.length; i++) {
		if (markers[i].start < markers[i - 1].end) {
			markers.splice(i, 1);
			i--;
		}
	}

	// Process the markers to create segments
	const segments: Segment.All[] = [];
	let lastPosition = 0;

	for (const marker of markers) {
		// Add text segment if there's content before this marker
		if (marker.start > lastPosition) {
			segments.push({
				type: "text",
				content: text.substring(lastPosition, marker.start),
			});
		}

		// Add the marked segment
		const content = text.substring(marker.start, marker.end);
		if (marker.type === "url") {
			segments.push({ type: "url", url: content });
		} else if (marker.type === "emote") {
			segments.push({
				type: "emote",
				id: `twitch/${marker.emoteId}`,
				name: content,
				imageUrl: getTwitchEmoteUrl(marker.emoteId!),
				aspectRatio: 1,
			});
		}

		lastPosition = marker.end;
	}

	// Add remaining text if any
	if (lastPosition < text.length) {
		const content = text.substring(lastPosition);
		if (content) {
			segments.push({ type: "text", content });
		}
	}

	return segments;
}

function getTwitchEmoteUrl(emoteId: string): string {
	const baseUrl = "https://static-cdn.jtvnw.net/emoticons/v2/";
	return `${baseUrl}${emoteId}/default/dark/2.0`;
}
