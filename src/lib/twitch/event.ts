import type { UserInfo } from "./client";

export type ChatMessage = {
	author: Author;
	text: string;
};

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
