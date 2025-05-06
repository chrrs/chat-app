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

	// Create an array of markers indicating where segments start and end
	type Marker = {
		position: number;
		type: "emote" | "url" | "text" | "mention";
		emoteId?: string;
		isEnd?: boolean;
	};

	const markers: Marker[] = [];

	// Remove the first mention if specified.
	if (removeFirstMention) {
		if (text.startsWith("@")) {
			let endOfMention = text.indexOf(" ");
			endOfMention = endOfMention === -1 ? text.length : endOfMention + 1;

			markers.push({ position: 0, type: "mention" });
			markers.push({ position: endOfMention, type: "text", isEnd: true });
		}
	}

	// Add markers for emotes
	for (const emote of emotes) {
		markers.push({
			position: emote.start,
			type: "emote",
			emoteId: emote.id,
		});
		markers.push({
			position: emote.end + 1,
			type: "text",
			isEnd: true,
		});
	}

	// Add markers for URLs
	URL_REGEX.lastIndex = 0; // Reset regex state
	let match = URL_REGEX.exec(text);
	while (match !== null) {
		const start = match.index;
		const end = start + match[0].length;

		markers.push({ position: start, type: "url" });
		markers.push({ position: end, type: "text", isEnd: true });

		match = URL_REGEX.exec(text);
	}

	// Sort markers by position
	markers.sort((a, b) => a.position - b.position);

	// Process the markers to create segments
	const segments: Segment.All[] = [];
	let currentType: Marker["type"] = "text";
	let currentEmoteId: string | undefined = undefined;
	let lastPosition = 0;

	for (const marker of markers) {
		// If there's text between the last position and this marker, add it
		if (marker.position > lastPosition && currentType !== marker.type) {
			const content = text.substring(lastPosition, marker.position);
			if (content) {
				if (currentType === "text") {
					segments.push({ type: "text", content });
				} else if (currentType === "url") {
					segments.push({ type: "url", url: content });
				} else if (currentType === "emote" && currentEmoteId) {
					segments.push({
						type: "emote",

						id: `twitch/${currentEmoteId}`,
						name: content,
						imageUrl: getTwitchEmoteUrl(currentEmoteId),
						aspectRatio: 1,
					});
				}
			}
		}

		// Update the state for the next segment
		if (!marker.isEnd) {
			currentType = marker.type;
			currentEmoteId = marker.emoteId;
		} else {
			currentType = "text";
			currentEmoteId = undefined;
		}

		lastPosition = marker.position;
	}

	// Don't forget the last segment
	if (lastPosition < text.length) {
		const content = text.substring(lastPosition);
		if (currentType === "text") {
			segments.push({ type: "text", content });
		} else if (currentType === "url") {
			segments.push({ type: "url", url: content });
		} else if (currentType === "emote" && currentEmoteId) {
			segments.push({
				type: "emote",

				id: `twitch/${currentEmoteId}`,
				name: content,
				imageUrl: getTwitchEmoteUrl(currentEmoteId),
				aspectRatio: 1,
			});
		}
	}

	return segments;
}

function getTwitchEmoteUrl(emoteId: string): string {
	const baseUrl = "https://static-cdn.jtvnw.net/emoticons/v2/";
	return `${baseUrl}${emoteId}/default/dark/2.0`;
}
