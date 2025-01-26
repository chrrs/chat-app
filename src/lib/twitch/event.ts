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
	export type Message = {
		type: "message";
		id: string;
		timestamp: Date;
		message: ChatMessage;
	};

	export type Notice = {
		type: "notice";
		id: string;
		timestamp: Date;
		text: string;
		message?: ChatMessage;
	};

	export type System = {
		type: "system";
		id: string;
		timestamp: Date;
		text: string;
	};

	export type Redemption = {
		type: "redemption";
		id: string;
		timestamp: Date;
		by: UserInfo;
		redemption: Reward;
	};

	export type Any = Message | Notice | System | Redemption;
}
