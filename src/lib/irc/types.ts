// Base interface for all IRC tags
export interface BaseTags {
	/** "1" if the event is historical, missing otherwise */
	historical?: "1";
	/** UNIX timestamp of when the message was historically received */
	"rm-received-ts"?: string;
	/** "1" if the message has been deleted */
	"rm-deleted"?: "1";

	/**
	 * Allows for additional tags not explicitly defined in the interfaces
	 * Some tags may just indicate presence without a value (true)
	 */
	[key: string]: string | true | undefined;
}

// PRIVMSG tags used for regular chat messages
export interface PrivmsgTags extends BaseTags {
	/** Contains metadata related to the chat badges in the badges tag. Currently, this tag contains metadata only for subscriber badges */
	"badge-info"?: string;
	/** Comma-separated list of chat badges in the form, <badge>/<version>. For example admin/1 */
	badges?: string;
	/** The amount of Bits the user cheered. Only a Bits cheer message includes this tag */
	bits?: string;
	/** Client-generated nonce for message deduplication */
	"client-nonce"?: string;
	/** The color of the user's name in the chat room. Hexadecimal RGB color code in the form #RRGGBB */
	color?: string;
	/** The user's display name, may contain uppercase letters and special characters */
	"display-name": string;
	/**
	 * A slash-delimited list of emotes and their positions in the message.
	 * Format: <emote ID>:<start position>-<end position>,<start position>-<end position>/<emote ID>:<start position>-<end position>
	 */
	emotes: string;
	/** "1" if this is the user's first message in the channel, "0" otherwise */
	"first-msg"?: "0" | "1";
	/** AutoMod flags in the format offset-length:type */
	flags?: string;
	/** A unique ID that identifies the message */
	id: string;
	/** "1" if the user is a moderator, "0" otherwise */
	mod: "0" | "1";
	/** "1" if the user has chatted in the channel before but not recently, "0" otherwise */
	"returning-chatter"?: "0" | "1";
	/** The ID of the chat room (channel) */
	"room-id": string;
	/** "1" if the user is a subscriber, "0" otherwise */
	subscriber: "0" | "1";
	/** The UNIX timestamp */
	"tmi-sent-ts": string;
	/** "1" if the user has Turbo, "0" otherwise */
	turbo: "0" | "1";
	/** The User ID of the user */
	"user-id": string;
	/**
	 * The type of user. Possible values:
	 * "" - A normal user
	 * admin - A Twitch administrator
	 * global_mod - A global moderator
	 * staff - A Twitch employee
	 */
	"user-type": "" | "admin" | "global_mod" | "staff";
	/** Present if the user is a VIP. The tag is included without a value if the user is a VIP */
	vip?: true;

	// Shared Chat tags
	/** Original badges in the source channel when using Shared Chat */
	"source-badges"?: string;
	/** Original badge info in the source channel when using Shared Chat */
	"source-badge-info"?: string;
	/** Original message ID in the source channel when using Shared Chat */
	"source-id"?: string;
	/** A Boolean that indicates if a message sent during a shared chat session is only sent to the source channel */
	"source-only"?: "0" | "1";
	/** Room ID where the message originated when using Shared Chat */
	"source-room-id"?: string;

	// Reply-specific tags
	/** ID of the message being replied to */
	"reply-parent-msg-id"?: string;
	/** User ID of the author of the message being replied to */
	"reply-parent-user-id"?: string;
	/** Login name of the author of the message being replied to */
	"reply-parent-user-login"?: string;
	/** Display name of the author of the message being replied to */
	"reply-parent-display-name"?: string;
	/** Content of the message being replied to */
	"reply-parent-msg-body"?: string;
	/** ID of the top-level parent message of the reply thread */
	"reply-thread-parent-msg-id"?: string;
	/** Login name of the sender of the top-level parent message */
	"reply-thread-parent-user-login"?: string;
}

// USERNOTICE tags for system messages like subscriptions, raids, etc.
export interface UsernoticeTags extends BaseTags {
	/** Contains metadata related to the chat badges in the badges tag */
	"badge-info"?: string;
	/** Comma-separated list of chat badges in the form <badge>/<version> */
	badges?: string;
	/** The color of the user's name in the chat room */
	color?: string;
	/** The user's display name */
	"display-name": string;
	/** A slash-delimited list of emotes and their positions in the message */
	emotes?: string;
	/** A unique ID that identifies this message */
	id: string;
	/** The login name of the user whose action generated the message */
	login: string;
	/** "1" if the user is a moderator, "0" otherwise */
	mod: "0" | "1";
	/**
	 * The type of notice (not the ID). Possible values:
	 * sub, resub, subgift, submysterygift, giftpaidupgrade, rewardgift,
	 * anongiftpaidupgrade, raid, unraid, bitsbadgetier, sharedchatnotice
	 */
	"msg-id":
		| "sub"
		| "resub"
		| "subgift"
		| "submysterygift"
		| "giftpaidupgrade"
		| "rewardgift"
		| "anongiftpaidupgrade"
		| "raid"
		| "unraid"
		| "bitsbadgetier"
		| "sharedchatnotice"
		| "announcement";
	/** The ID of the chat room (channel) */
	"room-id": string;
	/** "1" if the user is a subscriber, "0" otherwise */
	subscriber: "0" | "1";
	/** The message Twitch shows in the chat room for this notice */
	"system-msg": string;
	/** The UNIX timestamp for when the Twitch IRC server received the message */
	"tmi-sent-ts": string;
	/** "1" if the user has Turbo, "0" otherwise */
	turbo: "0" | "1";
	/** The user's ID */
	"user-id": string;
	/**
	 * The type of user. Possible values:
	 * "" - A normal user
	 * admin - A Twitch administrator
	 * global_mod - A global moderator
	 * staff - A Twitch employee
	 */
	"user-type": "" | "admin" | "global_mod" | "staff";

	// Shared Chat tags
	"source-badges"?: string;
	"source-badge-info"?: string;
	"source-id"?: string;
	"source-room-id"?: string;
	"source-msg-id"?: string;

	// Subscription and raid related tags
	/** The total number of months the user has subscribed (sub/resub notices) */
	"msg-param-cumulative-months"?: string;
	/** The display name of the broadcaster raiding this channel (raid notices) */
	"msg-param-displayName"?: string;
	/** The login name of the broadcaster raiding this channel (raid notices) */
	"msg-param-login"?: string;
	/** The total number of months the user has subscribed (subgift notices) */
	"msg-param-months"?: string;
	/** Number of gifts given during the promo (anongiftpaidupgrade/giftpaidupgrade) */
	"msg-param-promo-gift-total"?: string;
	/** The subscriptions promo name, if any (anongiftpaidupgrade/giftpaidupgrade) */
	"msg-param-promo-name"?: string;
	/** The display name of the subscription gift recipient (subgift notices) */
	"msg-param-recipient-display-name"?: string;
	/** The user ID of the subscription gift recipient (subgift notices) */
	"msg-param-recipient-id"?: string;
	/** The user name of the subscription gift recipient (subgift notices) */
	"msg-param-recipient-user-name"?: string;
	/** The login name of the user who gifted the subscription (giftpaidupgrade) */
	"msg-param-sender-login"?: string;
	/** The display name of the user who gifted the subscription (giftpaidupgrade) */
	"msg-param-sender-name"?: string;
	/** "1" if the user wants their streaks shared, "0" otherwise (sub/resub) */
	"msg-param-should-share-streak"?: "0" | "1";
	/** The number of consecutive months subscribed (sub/resub); 0 if not sharing */
	"msg-param-streak-months"?: string;
	/**
	 * The type of subscription plan being used:
	 * Prime - Amazon Prime subscription
	 * 1000 - First level of paid subscription
	 * 2000 - Second level of paid subscription
	 * 3000 - Third level of paid subscription
	 */
	"msg-param-sub-plan"?: "Prime" | "1000" | "2000" | "3000";
	/** The display name of the subscription plan */
	"msg-param-sub-plan-name"?: string;
	/** The number of viewers raiding this channel (raid notices) */
	"msg-param-viewerCount"?: string;
	/** The tier of the Bits badge the user just earned (bitsbadgetier notices) */
	"msg-param-threshold"?: string;
	/** The number of months gifted as part of a multi-month gift (subgift notices) */
	"msg-param-gift-months"?: string;
}

// NOTICE tags for general notices
export interface NoticeTags extends BaseTags {
	/**
	 * An ID that identifies the action's outcome
	 * e.g. "delete_message_success", "whisper_restricted"
	 */
	"msg-id": string;
	/** The ID of the user that the action targeted */
	"target-user-id"?: string;
}

// ROOMSTATE tags for channel state
export interface RoomstateTags extends BaseTags {
	/** "1" if emote-only mode is enabled, "0" otherwise */
	"emote-only": "0" | "1";
	/** Minimum time in minutes a user must follow to chat, "-1" if disabled */
	"followers-only": string;
	/** "1" if unique chat mode (R9K/Robot9000) is enabled, "0" otherwise */
	r9k: "0" | "1";
	/** The ID of the channel/room */
	"room-id": string;
	/** Minimum time in seconds between messages for users, "0" if disabled */
	slow: string;
	/** "1" if subscribers-only mode is enabled, "0" otherwise */
	"subs-only": "0" | "1";
}

// USERSTATE tags for user state in a channel
export interface UserstateTags extends BaseTags {
	/** Contains metadata related to the chat badges in the badges tag */
	"badge-info"?: string;
	/** Comma-separated list of chat badges in the form <badge>/<version> */
	badges: string;
	/** The color of the user's name in the chat room */
	color?: string;
	/** The user's display name */
	"display-name": string;
	/** A comma-delimited list of IDs that identify the emote sets the user has access to */
	"emote-sets": string;
	/** An ID that uniquely identifies the message, if a PRIVMSG was sent */
	id?: string;
	/** "1" if the user is a moderator, "0" otherwise */
	mod: "0" | "1";
	/** "1" if the user is a subscriber, "0" otherwise */
	subscriber: "0" | "1";
	/** "1" if the user has Turbo, "0" otherwise */
	turbo: "0" | "1";
	/**
	 * The type of user. Possible values:
	 * "" - A normal user
	 * admin - A Twitch administrator
	 * global_mod - A global moderator
	 * staff - A Twitch employee
	 */
	"user-type": "" | "admin" | "global_mod" | "staff";
}

// CLEARCHAT tags for ban/timeout events
export interface ClearchatTags extends BaseTags {
	/** Duration of the timeout in seconds, not present for permanent bans */
	"ban-duration"?: string;
	/** The ID of the channel/room */
	"room-id": string;
	/** ID of the user who was banned/timed out */
	"target-user-id"?: string;
}

// CLEARMSG tags for deleted messages
export interface ClearmsgTags extends BaseTags {
	/** Username of the sender of the deleted message */
	login: string;
	/** The ID of the channel/room */
	"room-id": string;
	/** ID of the message that was deleted */
	"target-msg-id": string;
}

// GLOBALUSERSTATE tags for global user state
export interface GlobaluserstateTags extends BaseTags {
	/** Additional metadata for badges */
	"badge-info"?: string;
	/** Global badges the user has */
	badges: string;
	/** The color of the user's name in the chat room */
	color?: string;
	/** The user's display name */
	"display-name": string;
	/** Comma-separated list of emote sets available to the user */
	"emote-sets": string;
	/** "1" if the user has Turbo, "0" otherwise */
	turbo: "0" | "1";
	/** The user's ID */
	"user-id": string;
	/**
	 * The type of user. Possible values:
	 * "" - A normal user
	 * admin - A Twitch administrator
	 * global_mod - A global moderator
	 * staff - A Twitch employee
	 */
	"user-type": "" | "admin" | "global_mod" | "staff";
}

// Union type for all IRC tags
export type TwitchIrcTags =
	| PrivmsgTags
	| UsernoticeTags
	| NoticeTags
	| RoomstateTags
	| UserstateTags
	| ClearchatTags
	| ClearmsgTags
	| GlobaluserstateTags;
