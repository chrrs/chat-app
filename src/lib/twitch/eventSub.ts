import Emittery from "emittery";
import type { HelixClient } from "./helix";

// biome-ignore lint/suspicious/noExplicitAny: just to make working with API types easier.
export type NotificationPayload = any;

type SubscribeFn = (type: string, version: number, condition: object) => void;
type UnsubscribeFn = () => void;

type Events = {
	ready: undefined;
	connected: undefined;
	disconnected: undefined;
	reconnectRequested: undefined;
	notification: NotificationPayload;
};

type WebSocketExtensions = {
	reconnecting: boolean;
	wasConnected: boolean;
};

export class EventSubClient {
	private helix: HelixClient;
	private ws: WebSocket | null = null;

	private sessionId: string | null = null;

	private emitter = new Emittery<Events>();

	on: Emittery<Events>["on"] = (event, handler) =>
		this.emitter.on(event, handler);
	off: Emittery<Events>["off"] = (event, handler) =>
		this.emitter.off(event, handler);

	constructor(helix: HelixClient) {
		this.helix = helix;
	}

	get connected() {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
	}

	subscribe(subscribe: (to: SubscribeFn) => void): UnsubscribeFn {
		let closed = false;
		let ids: string[] = [];

		// Resubscribe to all events given by the passed function.
		const resubscribe = () => {
			ids = [];
			subscribe(async (type, version, condition) => {
				const res = await this.helix.post("eventsub/subscriptions", {
					body: JSON.stringify({
						type,
						version: String(version),
						condition,
						transport: {
							method: "websocket",
							session_id: this.sessionId,
						},
					}),
				});

				const body = await res.json();
				const id = body.data[0].id;

				if (closed) this.helix.delete(`eventsub/subscriptions?id=${id}`);
				else ids.push(id);
			});
		};

		// Unsubscribe from all events.
		const unsubscribe = () => {
			if (closed) return;
			closed = true;

			this.emitter.off("ready", resubscribe);
			for (const id of ids) {
				this.helix.delete(`eventsub/subscriptions?id=${id}`);
			}
		};

		// First we wait to be connected, then we subscribe and
		// make sure we resubscribe on reconnect.
		this.connect().then(() => {
			this.emitter.on("connected", resubscribe);
			resubscribe();
		});

		return unsubscribe;
	}

	connect(url?: string, reconnecting = false): Promise<void> {
		return new Promise((resolve) => {
			// If we're already connected, we don't need to connect again.
			if (this.ws !== null) {
				if (this.connected) resolve();
				else this.emitter.once("ready").then(resolve);
				return;
			}

			// @ts-expect-error: we're setting the reconnecting boolean in the next line.
			const ws: WebSocket & WebSocketExtensions = new WebSocket(
				url ?? "wss://eventsub.wss.twitch.tv/ws",
			);

			ws.reconnecting = false;
			ws.wasConnected = false;
			this.ws = ws;

			ws.onopen = () => {
				ws.wasConnected = true;
			};

			ws.onmessage = (event) => {
				const message = JSON.parse(event.data);
				const type = message.metadata.message_type;

				if (type === "session_welcome") {
					this.sessionId = message.payload.session.id;
					if (!reconnecting) this.emitter.emit("connected");

					this.emitter.emit("ready");
					resolve();
				} else if (type === "session_reconnect") {
					this.emitter.emit("reconnectRequested");

					ws.reconnecting = true;
					ws.close();

					const url = message.payload.session.reconnect_url;
					this.connect(url, true);
				} else if (type === "notification") {
					this.emitter.emit("notification", message.payload);
				}
			};

			// Reconnect if we closed unexpectedly.
			ws.onclose = (_event) => {
				this.ws = null;

				if (ws.wasConnected) this.emitter.emit("disconnected");
				if (!ws.reconnecting) setTimeout(() => this.connect(), 500);
			};
		});
	}

	private disconnect() {
		this.ws?.close();
	}
}
