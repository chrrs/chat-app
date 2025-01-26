import type { BadgeInfo, Badges } from "@/components/BadgeProvider";
import Emittery from "emittery";
import type { TwitchClient, UserInfo } from "./client";
import type { ChatEvent, ChatMessage, Fragment } from "./event";
import type { NotificationPayload } from "./eventSub";

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

	// biome-ignore lint/suspicious/noExplicitAny: we don't have proper API types.
	private parseChatMessage(event: any): ChatMessage {
		return {
			author: {
				id: event.chatter_user_id,
				login: event.chatter_user_login,
				name: event.chatter_user_name,
				color: getColor(event.color),
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

	private onNotification(payload: NotificationPayload) {
		if (payload?.subscription?.type === "channel.chat.message") {
			if (payload.event.broadcaster_user_id !== this.info.id) {
				return;
			}

			this.emitter.emit("event", {
				type: "message",
				id: payload.event.message_id,
				timestamp: new Date(payload.subscription.created_at),
				message: this.parseChatMessage(payload.event),
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
					payload.event.message.text !== ""
						? this.parseChatMessage(payload.event)
						: undefined,
			});
		} else if (
			payload?.subscription?.type ===
			"channel.channel_points_custom_reward_redemption.add"
		) {
			this.emitter.emit("event", {
				type: "redemption",
				id: payload.event.id,
				timestamp: new Date(payload.event.redeemed_at),
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
					url: version.image_url_2x,
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
