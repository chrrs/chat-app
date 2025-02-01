import type { BadgeInfo, Badges } from "@/components/BadgeProvider";
import Emittery from "emittery";
import type { TwitchClient, UserInfo } from "./client";
import { type ChatEvent, parseHelixMessage } from "./event";
import type { NotificationPayload } from "./eventSub";
import { parseIrcEvent } from "./irc";

let systemMessageId = 0;

type Events = {
	event: ChatEvent.Any;
	connected: undefined;
};

export class Channel {
	private client: TwitchClient;
	private emitter = new Emittery<Events>();

	private subscriptions: (() => void)[] = [];

	private lastMessage = new Date(0);

	on: Emittery<Events>["on"] = (event, handler) =>
		this.emitter.on(event, handler);
	off: Emittery<Events>["off"] = (event, handler) =>
		this.emitter.off(event, handler);

	info: UserInfo;

	constructor(client: TwitchClient, info: UserInfo) {
		this.client = client;
		this.info = info;

		// FIXME: Some really dirty code to avoid line breaks.
		const s = this.subscriptions.push.bind(this.subscriptions);
		const on = this.client.eventSub.on.bind(this.client.eventSub);
		const msg = this.addSystemMessage.bind(this);

		s(on("notification", (payload) => this.onEvent(payload)));
		s(on("disconnected", () => msg("Disconnected from Twitch.")));
		s(on("connected", () => msg("Connected to Twitch.")));
		s(on("reconnectRequested", () => msg("Twitch asked us to reconnect.")));

		s(on("connected", () => this.emitter.emit("connected")));

		const unsubscribe = this.client.eventSub.subscribe((to) => {
			const condition = {
				broadcaster_user_id: info.id,
				user_id: client.self.id,
			};

			to("channel.chat.message", 1, condition);
			to("channel.chat.notification", 1, condition);

			to("channel.channel_points_custom_reward_redemption.add", 1, {
				broadcaster_user_id: info.id,
			});
		});

		this.subscriptions.push(unsubscribe);
	}

	close() {
		this.emitter.clearListeners();
		for (const unsubscribe of this.subscriptions) {
			unsubscribe();
		}
	}

	addSystemMessage(text: string) {
		this.emitter.emit("event", {
			type: "system",
			id: `sys_${systemMessageId++}`,
			timestamp: new Date(),
			historical: false,
			text,
		});
	}

	get connected() {
		return this.client.eventSub.connected;
	}

	async fetchHistoricEvents(): Promise<ChatEvent.Any[]> {
		const base = "https://recent-messages.robotty.de/api/v2/recent-messages/";
		const res = await fetch(
			`${base}${this.info.login}?before=${Date.now()}&after=${this.lastMessage.getTime()}`,
		);

		const body = await res.json();

		if (!res.ok) {
			throw new Error(`API error '${body.error}'`, { cause: body });
		}

		this.lastMessage = new Date();
		return body.messages
			.map(parseIrcEvent)
			.filter((event: ChatEvent.Any | null) => event !== null);
	}

	private onEvent(payload: NotificationPayload) {
		const timestamp = new Date();
		this.lastMessage = timestamp;

		if (payload.subscription.type === "channel.chat.message") {
			if (payload.event.broadcaster_user_id !== this.info.id) {
				return;
			}

			this.emitter.emit("event", {
				type: "message",
				id: payload.event.message_id,
				timestamp,
				historical: false,
				message: parseHelixMessage(payload.event),
			});
		} else if (payload.subscription.type === "channel.chat.notification") {
			const text =
				payload.event.notice_type === "announcement"
					? "Announcement"
					: payload.event.system_message;

			this.emitter.emit("event", {
				type: "notice",
				id: payload.event.message_id,
				timestamp,
				historical: false,
				text,
				message:
					payload.event.message.text !== ""
						? parseHelixMessage(payload.event)
						: undefined,
			});
		} else if (
			payload.subscription.type ===
			"channel.channel_points_custom_reward_redemption.add"
		) {
			this.emitter.emit("event", {
				type: "redemption",
				id: payload.event.id,
				timestamp,
				historical: false,
				by: {
					id: payload.event.user_id,
					login: payload.event.user_login,
					name: payload.event.user_name,
				},
				redemption: {
					id: payload.event.reward.id,
					title: payload.event.reward.title,
					cost: payload.event.reward.cost,
					input: payload.event.user_input,
				},
			});
		}
	}

	async fetchChannelBadges(): Promise<Badges> {
		const res = await this.client.helix.get(
			`chat/badges?broadcaster_id=${this.info.id}`,
		);
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

	async sendMessage(message: string): Promise<void> {
		await this.client.helix.post("chat/messages", {
			body: JSON.stringify({
				broadcaster_id: this.info.id,
				sender_id: this.client.self.id,
				message,
			}),
		});
	}
}
