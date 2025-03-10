import type { UserInfo } from "./client";

export type ChatMessage = {
	author: Author;
	text: string;
	fragments: Fragment.Any[];
};

export namespace Fragment {
	export type Text = {
		type: "text";
		text: string;
	};

	export type Emote = {
		type: "emote";
		id: string;
		name: string;
		url: string;
		aspect: number;
	};

	export type Mention = {
		type: "mention";
		text: string;
		user: UserInfo;
	};

	export type Any = Text | Emote | Mention;
}

export type BadgeIdentifier = {
	set: string;
	id: string;
};

export type Author = UserInfo & {
	color: string;
	badges: BadgeIdentifier[];
};

export type Reward = {
	id: string;
	title: string;
	cost: number;
	input?: string;
};

export namespace ChatEvent {
	type Base = {
		id: string;
		timestamp: Date;
		historical: boolean;
	};

	export type Message = Base & {
		type: "message";
		message: ChatMessage;
	};

	export type Notice = Base & {
		type: "notice";
		text: string;
		message?: ChatMessage;
	};

	export type System = Base & {
		type: "system";
		text: string;
	};

	export type Redemption = Base & {
		type: "redemption";
		by: UserInfo;
		redemption: Reward;
	};

	export type Any = Message | Notice | System | Redemption;
}

// biome-ignore lint/suspicious/noExplicitAny: we don't have proper API types.
export function parseHelixMessage(event: any): ChatMessage {
	// FIXME: Sometimes messages end with '󠀀' (\uE0000). Seems to be an anti-spam thing.
	console.log(event);

	return {
		author: {
			id: event.chatter_user_id,
			login: event.chatter_user_login,
			name: event.chatter_user_name,
			color: getNameColor(event.color),
			badges: event.badges.map((badge: Record<string, string>) => ({
				set: badge.set_id,
				id: badge.id,
			})),
		},
		text: event.message.text,
		// @ts-ignore: FIXME
		fragments: event.message.fragments.map((fragment) =>
			fragment.type === "emote"
				? ({
						type: "emote",
						id: fragment.emote.id,
						name: fragment.text,
						url: `https://static-cdn.jtvnw.net/emoticons/v2/${fragment.emote.id}/default/light/2.0`,
						aspect: 1,
					} satisfies Fragment.Emote)
				: fragment.type === "mention"
					? ({
							type: "mention",
							text: fragment.text,
							user: {
								id: fragment.mention.user_id,
								login: fragment.mention.user_login,
								name: fragment.mention.user_name,
							},
						} satisfies Fragment.Mention)
					: ({
							type: "text",
							text: fragment.text,
						} satisfies Fragment.Text),
		),
	};
}

export function getNameColor(color: string) {
	return color.length === 0 ? "gray" : color;
}
