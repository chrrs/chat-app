import Emittery from "emittery";
import type { TwitchClient, UserInfo } from "./client";
import type { ChatEvent } from "./event";
import type { NotificationPayload } from "./eventSub";
import type { BadgeInfo, Badges } from "@/components/BadgeProvider";

let systemMessageId = 0;

type Events = {
	event: ChatEvent.Any;
};

export class Channel {
	private client: TwitchClient;
	private emitter = new Emittery<Events>();

	private subscriptions: (() => void)[] = [];

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

		s(on("notification", (event) => this.onNotification(event)));
		s(on("disconnected", () => msg("Disconnected from Twitch.")));
		s(on("connected", () => msg("Connected to Twitch.")));
		s(on("reconnectRequested", () => msg("Twitch asked us to reconnect.")));

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
		for (const unsubscribe of this.subscriptions) {
			unsubscribe();
		}
	}

	addSystemMessage(text: string) {
		this.emitter.emit("event", {
			type: "system",
			id: `sys_${systemMessageId++}`,
			timestamp: new Date(),
			text,
		});
	}

	private onNotification(payload: NotificationPayload) {
		if (payload?.subscription?.type === "channel.chat.message") {
			if (payload.event.broadcaster_user_id !== this.info.id) {
				return;
			}

			this.emitter.emit("event", {
				type: "message",
				id: payload.event.message_id,
				timestamp: new Date(payload.subscription.created_at),
				message: {
					author: {
						id: payload.event.chatter_user_id,
						login: payload.event.chatter_user_login,
						name: payload.event.chatter_user_name,
						color: getColor(payload.event.color),
						badges: payload.event.badges.map(
							(badge: Record<string, string>) => ({
								set: badge.set_id,
								id: badge.id,
							}),
						),
					},
					text: payload.event.message.text,
				},
			});
		} else if (payload?.subscription?.type === "channel.chat.notification") {
			const text =
				payload.event.notice_type === "announcement"
					? "Announcement"
					: payload.event.system_message;

			this.emitter.emit("event", {
				type: "notice",
				id: payload.event.message_id,
				timestamp: new Date(payload.subscription.created_at),
				text,
				message:
					payload.event.message && payload.event.message.text.length > 0
						? {
								author: {
									id: payload.event.chatter_user_id,
									login: payload.event.chatter_user_login,
									name: payload.event.chatter_user_name,
									color: getColor(payload.event.color),
									badges: payload.event.badges.map(
										(badge: Record<string, string>) => ({
											set: badge.set_id,
											id: badge.id,
										}),
									),
								},
								text: payload.event.message.text,
							}
						: undefined,
			});
		} else if (
			payload?.subscription?.type ===
			"channel.channel_points_custom_reward_redemption.add"
		) {
			this.emitter.emit("event", {
				type: "redemption",
				id: payload.event.id,
				timestamp: new Date(payload.subscription.redeemed_at),
				by: {
					id: payload.event.user_user_id,
					login: payload.event.user_user_login,
					name: payload.event.user_user_name,
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

	async badges(): Promise<Badges> {
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
					image: version.image_url_2x,
					title: version.title,
					description: version.description,
				} satisfies BadgeInfo,
			]),
		);

		return Object.fromEntries(badges);
	}

	async send(message: string): Promise<void> {
		await this.client.helix.post("chat/messages", {
			body: JSON.stringify({
				broadcaster_id: this.info.id,
				sender_id: this.client.self.id,
				message,
			}),
		});
	}
}

function getColor(color: string) {
	return color.length === 0 ? "gray" : color;
}
