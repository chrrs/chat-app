import type { BadgeInfo, Badges } from "@/components/BadgeProvider";
import { Channel } from "./channel";
import type { EmoteInfo, Emotes } from "./emote";
import { EventSubClient } from "./eventSub";
import { HelixClient } from "./helix";

export interface TwitchAuth {
	clientId: string;
	authToken: string;
}

export interface UserInfo {
	id: string;
	login: string;
	name: string;
}

export interface StreamInfo {
	user?: UserInfo;
	stream?: {
		title: string;
		game: string;
		viewers: number;
	};
}

export class TwitchClient {
	helix: HelixClient;
	eventSub: EventSubClient;
	self: UserInfo;

	static async authenticate(token: string): Promise<TwitchClient | null> {
		const res = await fetch("https://id.twitch.tv/oauth2/validate", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		const body = await res.json();

		if (!res.ok) {
			console.warn("failed to authenticate:", body.message);
			return null;
		}

		const auth = {
			clientId: body.client_id,
			authToken: token,
		} satisfies TwitchAuth;

		return new TwitchClient(auth, {
			id: body.user_id,
			login: body.login,
			name: body.login,
		});
	}

	private constructor(auth: TwitchAuth, self: UserInfo) {
		this.helix = new HelixClient(auth);
		this.eventSub = new EventSubClient(this.helix);
		this.self = self;
	}

	async getChannel(login: string): Promise<Channel> {
		const res = await this.helix.get(`users?login=${login}`);
		const data = await res.json();
		if (data.data.length === 0) {
			throw new Error("channel does not exist");
		}

		const info = data.data[0];
		return new Channel(this, {
			id: info.id,
			login: info.login,
			name: info.display_name,
		});
	}

	async fetchGlobalBadges(): Promise<Badges> {
		const res = await this.helix.get("chat/badges/global");
		const data = await res.json();

		// @ts-ignore: FIXME
		const badges = data.data.flatMap((set) =>
			// @ts-ignore: FIXME
			set.versions.map((version) => [
				`${set.set_id}/${version.id}`,
				{
					url: version.image_url_2x,
					title: version.title,
					description: version.description,
				} satisfies BadgeInfo,
			]),
		);

		return Object.fromEntries(badges);
	}

	async fetchGlobalBttvEmotes(): Promise<Emotes> {
		const res = await fetch("https://api.betterttv.net/3/cached/emotes/global");
		const data = await res.json();

		// @ts-ignore: FIXME
		const emotes = data.map((emote) => [
			emote.code,
			{
				id: emote.id,
				name: emote.code,
				url: `https://cdn.betterttv.net/emote/${emote.id}/2x.webp`,
				aspect: emote.width ? emote.width / emote.height : 1,
			} satisfies EmoteInfo,
		]);

		return Object.fromEntries(emotes);
	}

	async fetchGlobalFfzEmotes(): Promise<Emotes> {
		const res = await fetch("https://api.frankerfacez.com/v1/set/global");
		const data = await res.json();

		// @ts-ignore: FIXME
		const emotes = Object.values(data.sets).flatMap((set) =>
			// @ts-ignore: FIXME
			set.emoticons.map((emote) => [
				emote.name,
				{
					id: String(emote.id),
					name: emote.name,
					url: emote.urls["2"],
					aspect: emote.width ? emote.width / emote.height : 1,
				} satisfies EmoteInfo,
			]),
		);

		return Object.fromEntries(emotes);
	}

	async fetchStreams(logins: string[]): Promise<Record<string, StreamInfo>> {
		const streamsPromise = (async () => {
			const query = logins.map((login) => `user_login=${login}`).join("&");
			return await this.helix.get(`streams?${query}`).then((res) => res.json());
		})();

		const usersPromise = (async () => {
			const query = logins.map((login) => `login=${login}`).join("&");
			return await this.helix.get(`users?${query}`).then((res) => res.json());
		})();

		const [streams, users] = await Promise.all([streamsPromise, usersPromise]);

		const out = Object.fromEntries(
			logins.map((login) => [login, {} as StreamInfo]),
		);

		for (const stream of streams.data) {
			out[stream.user_login] ??= {};
			out[stream.user_login].stream = {
				title: stream.title,
				game: stream.game_name,
				viewers: stream.viewer_count,
			};
		}

		for (const user of users.data) {
			out[user.login] ??= {};
			out[user.login].user = {
				id: user.id,
				login: user.login,
				name: user.display_name,
			};
		}

		return out;
	}

	async getUsableEmotes(): Promise<Emotes> {
		let after: string | undefined;
		let emotes: Emotes = {};

		do {
			const query = after === undefined ? "" : `&after=${after}`;
			const res = await this.helix
				.get(`chat/emotes/user?user_id=${this.self.id}${query}`)
				.then((res) => res.json());

			after = res.pagination?.cursor;

			emotes = {
				...emotes,
				...Object.fromEntries(
					// @ts-expect-error: FIXME
					res.data.map((emote) => [
						emote.name,
						{
							id: emote.id,
							name: emote.name,
							url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/light/2.0`,
							aspect: 1,
						} satisfies EmoteInfo,
					]),
				),
			};
		} while (after !== undefined);

		return emotes;
	}
}
