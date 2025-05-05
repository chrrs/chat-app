import { useCallback, useEffect, useRef, useState } from "react";
import { type Message, parse } from "tekko";
import { useTwitchAuth } from "../store/auth";
import type { ClearchatTags, PrivmsgTags, TwitchIrcTags, UsernoticeTags } from "./types";

export interface User {
	id: string;
	login: string;
	name: string;

	color?: string;
	badges: Badge[];
}

export interface ChatMessage {
	id: string;
	author: User;
	emotes: Emote[];
	text: string;
}

export interface Badge {
	id: string;
	version: string;
}

export interface Emote {
	id: string;
	start: number;
	end: number;
}

export namespace Event {
	interface Base {
		id: string;
		time: number;
		historical: boolean;
		deleted: boolean;
	}

	export interface Message extends Base {
		type: "message";
		message: ChatMessage;
		isAction: boolean;
		isFirstMessage: boolean;
		replyTo?: ChatMessage;
		bits?: number;
	}

	export interface UserNotice extends Base {
		type: "usernotice";
		messageType: UsernoticeTags["msg-id"];
		message?: ChatMessage;
		text: string;
	}

	export interface SystemMessage extends Base {
		type: "system";
		text: string;
	}

	export type All = Message | UserNotice | SystemMessage;
}

/**
 * Parse badges from a badges string into an array of Badge objects
 */
function parseBadges(badgesStr?: string): Badge[] {
	if (!badgesStr) return [];

	return badgesStr.split(",").map((badge: string) => {
		const [id, version] = badge.split("/");
		return { id, version };
	});
}

/**
 * Parse emotes from an emotes string into an array of Emote objects
 */
function parseEmotes(emotesStr?: string): Emote[] {
	const emotes: Emote[] = [];
	if (!emotesStr) return emotes;

	const emoteEntries = emotesStr.split("/");
	for (const entry of emoteEntries) {
		if (!entry) continue;

		const [id, positions] = entry.split(":");
		if (!positions) continue;

		const positionPairs = positions.split(",");
		for (const pair of positionPairs) {
			const [start, end] = pair.split("-").map(Number);
			emotes.push({ id, start, end });
		}
	}

	return emotes;
}

let nextEventId = 0;
function ircToEvent(msg: Message<TwitchIrcTags>): Event.All | null {
	const id = (nextEventId++).toString(16);
	const timeStr = msg.tags?.["tmi-sent-ts"];
	const time = timeStr && typeof timeStr === "string" ? Number.parseInt(timeStr, 10) : Date.now();
	const historical = msg.tags?.historical === "1";
	const deleted = msg.tags?.["rm-deleted"] === "1";

	// Common base properties
	const base = {
		id,
		time,
		historical,
		deleted,
	};

	const messageContent = msg.params.length > 1 ? msg.params[msg.params.length - 1] : undefined;

	switch (msg.command) {
		case "PRIVMSG": {
			// Regular chat messages
			const tags = msg.tags as PrivmsgTags;

			// Check if it's an action message (/me command)
			let messageText = messageContent ?? "<no message>";
			let isAction = false;

			// Action messages start with \u0001ACTION and end with \u0001
			if (messageText.startsWith("\u0001ACTION ") && messageText.endsWith("\u0001")) {
				isAction = true;
				messageText = messageText.slice(8, -1); // Remove the \u0001ACTION prefix and \u0001 suffix
			}

			// Create user object
			const author: User = {
				id: tags["user-id"],
				login: msg.prefix?.user ?? "",
				name: tags["display-name"],
				color: tags.color,
				badges: parseBadges(tags.badges),
			};

			// Build the chat message object
			const message: ChatMessage = {
				id: tags.id,
				author,
				emotes: parseEmotes(tags.emotes),
				text: messageText,
			};

			// Parse bits if they exist
			const bits = tags.bits ? Number.parseInt(tags.bits, 10) : undefined;

			// Handle reply-to if present
			let replyTo: ChatMessage | undefined;
			if (tags["reply-parent-msg-id"]) {
				replyTo = {
					id: tags["reply-parent-msg-id"],
					author: {
						id: tags["reply-parent-user-id"] ?? "",
						login: tags["reply-parent-user-login"] ?? "",
						name: tags["reply-parent-display-name"] ?? tags["reply-parent-user-login"] ?? "",
						badges: [], // We don't have badge info for the parent message
					},
					emotes: [], // We don't have emote info for the parent message
					text: tags["reply-parent-msg-body"] ?? "",
				};
			}

			return {
				...base,
				type: "message",
				message,
				isAction,
				isFirstMessage: tags["first-msg"] === "1",
				replyTo,
				bits,
			};
		}

		case "USERNOTICE": {
			// Subscription, raid, and other system events
			const tags = msg.tags as UsernoticeTags;

			// Some usernotices can have an attached message
			let message: ChatMessage | undefined;
			if (messageContent) {
				// Create user object
				const author: User = {
					id: tags["user-id"],
					login: tags.login,
					name: tags["display-name"],
					color: tags.color,
					badges: parseBadges(tags.badges),
				};

				message = {
					id: tags.id,
					author,
					emotes: parseEmotes(tags.emotes),
					text: messageContent,
				};
			}

			let systemMsg = tags["system-msg"];
			if (tags["msg-id"] === "announcement") {
				systemMsg = "Announcement";
			}

			return {
				...base,
				type: "usernotice",
				messageType: tags["msg-id"],
				message,
				text: systemMsg,
			};
		}

		case "NOTICE": {
			// Channel notices, system messages, errors
			const text = messageContent ?? "<no message>";

			return {
				...base,
				type: "system",
				text,
			};
		}

		case "CLEARCHAT": {
			// Handle chat clear and timeouts
			const tags = msg.tags as ClearchatTags;
			let text = "";

			if (tags["target-user-id"]) {
				// The username might be in the last parameter for targeted clearchat messages
				const username = messageContent || "A user";
				const duration = tags["ban-duration"];

				if (duration) {
					text = `${username} has been timed out for ${duration} seconds.`;
				} else {
					text = `${username} has been banned from the channel.`;
				}
			} else {
				text = "The chat has been cleared by a moderator.";
			}

			return {
				...base,
				type: "system",
				text,
			};
		}

		case "CLEARMSG": {
			const login = msg.tags?.login;
			const text = login ? `A message from ${login} was deleted.` : "A message was deleted.";

			return {
				...base,
				type: "system",
				text,
			};
		}

		default:
			return null;
	}
}

export function useChat(login: string) {
	const [events, setEvents] = useState<Event.All[]>([]);
	const eventsRef = useRef<Event.All[]>([]);

	const session = useTwitchAuth((state) => state.session);

	// Push new events to the list, limiting the size to 1000.
	const pushEvents = useCallback((events: Event.All[], sort = false) => {
		setEvents((prev) => {
			let newEvents = [...prev, ...events];
			if (sort) newEvents.sort((a, b) => a.time - b.time);
			newEvents = newEvents.length > 1000 ? newEvents.slice(-1000) : newEvents;
			eventsRef.current = newEvents;
			return newEvents;
		});
	}, []);

	// Push new system message to the list.
	const pushSystemMessage = useCallback(
		(text: string) =>
			pushEvents([
				{
					type: "system",
					id: (nextEventId++).toString(16),
					time: Date.now(),
					historical: false,
					deleted: false,
					text,
				},
			]),
		[pushEvents],
	);

	// Handle incoming IRC messages.
	const handleIrcMessage = useCallback(
		(msg: Message<TwitchIrcTags>) => {
			// Handle CLEARCHAT messages which are used for message deletion and timeouts
			if (msg.command === "CLEARCHAT") {
				const tags = msg.tags as ClearchatTags;

				if (tags["target-user-id"]) {
					// If there's a target user, only set their messages as deleted
					const targetUserId = tags["target-user-id"];
					setEvents((prev) => {
						const updatedEvents = prev.map((event) => {
							if (
								(event.type === "message" && event.message.author.id === targetUserId) ||
								(event.type === "usernotice" && event.message?.author.id === targetUserId)
							) {
								return { ...event, deleted: true };
							}

							return event;
						});
						eventsRef.current = updatedEvents;
						return updatedEvents;
					});
				} else {
					// If no target user, it's a chat clear command that affects all messages
					setEvents((prev) => {
						const updatedEvents = prev.map((event) => ({ ...event, deleted: true }));
						eventsRef.current = updatedEvents;
						return updatedEvents;
					});
				}
			}

			// Handle CLEARMSG messages which are used for individual message deletion
			if (msg.command === "CLEARMSG") {
				// Extract the target message ID from the tags
				const targetMsgId = msg.tags?.["target-msg-id"];
				if (targetMsgId) {
					// Find and mark the specific message as deleted
					setEvents((prev) => {
						const updatedEvents = prev.map((event) => {
							if (
								(event.type === "message" && event.message.id === targetMsgId) ||
								(event.type === "usernotice" && event.message?.id === targetMsgId)
							) {
								return { ...event, deleted: true };
							}
							return event;
						});
						eventsRef.current = updatedEvents;
						return updatedEvents;
					});
				}
			}

			const event = ircToEvent(msg);
			if (event !== null) pushEvents([event]);
		},
		[pushEvents],
	);

	// Fetch old messages from a third-party API.
	const fetchOldMessages = useCallback(
		async (after: number) => {
			const query = new URLSearchParams({ before: Date.now().toString(), after: after.toString() });
			const url = `https://recent-messages.robotty.de/api/v2/recent-messages/${login}?${query}`;

			// FIXME: handle errors.
			const res = await fetch(url)
				.then((res) => res.json())
				.catch((error) => console.error("couldn't fetch recent messages:", error));
			if (res.error) {
				console.error("recent messages api error:", res.error);
			}

			if (res.messages) {
				// @ts-expect-error: tekko doesn't accept undefined for message tags.
				const messages = (res.messages as string[]).map((msg) => parse<TwitchIrcTags>(msg));
				const events = messages.map(ircToEvent).filter((event) => event !== null);
				pushEvents(events, true);
			}
		},
		[login, pushEvents],
	);

	useEffect(() => {
		let lastMessageTime = 0;

		// On disconnect, update last message time.
		const handleDisconnect = () => {
			lastMessageTime = Date.now();
			pushSystemMessage("Disconnected from chat.");
		};
		session!.ircClient.on("disconnected", handleDisconnect);

		// When we receive a message, parse it and push it to the list.
		const handleMessage = (msg: Message<TwitchIrcTags>) => handleIrcMessage(msg);
		session!.ircClient.on("message", handleMessage);

		// When we're ready, or we reconnected, fetch old messages.
		const handleReady = async () => {
			pushSystemMessage("Connected to chat.");
			return await fetchOldMessages(lastMessageTime);
		};
		session!.ircClient.ready.then(async () => {
			await handleReady();
			session!.ircClient.on("ready", handleReady);
		});

		session!.ircClient.join(login);

		return () => {
			session!.ircClient.part(login);
			session!.ircClient.off("disconnected", handleDisconnect);
			session!.ircClient.off("message", handleMessage);
			session!.ircClient.off("ready", handleReady);
		};
	}, [session, login, fetchOldMessages, handleIrcMessage, pushSystemMessage]);

	return { events, pushSystemMessage };
}
