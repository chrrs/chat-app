import { type AuthProvider, InvalidTokenTypeError, getTokenInfo } from "@twurple/auth";
import Emittery from "emittery";
import { type Message, parse } from "tekko";
import type { TwitchIrcTags } from "./types";

// TypeScript utility types for the emitter
export type ClientEvents = {
	connecting: undefined;
	connected: undefined;
	ready: undefined;
	disconnected: undefined;
	reconnecting: { attempt: number; backoff: number };
	error: Error;
	message: Message<TwitchIrcTags>;
};

/**
 * Twitch IRC Client that handles WebSocket connection to Twitch's IRC servers
 * with automatic reconnection capabilities.
 */
export class TwitchIrcClient extends Emittery<ClientEvents> {
	private authProvider?: AuthProvider;
	private ws: WebSocket | null = null;
	private channels: Set<string> = new Set();
	private reconnectTimeout: number | null = null;
	private reconnectAttempts = 0;
	private authenticated = false;
	private intentionalDisconnect = false;

	// Hardcoded connection settings
	private readonly url = "wss://irc-ws.chat.twitch.tv:443";
	private readonly reconnectInterval = 1000;
	private readonly maxReconnectInterval = 30000;
	private readonly reconnectMultiplier = 1.5;

	/**
	 * Create a new Twitch IRC client
	 * @param authProvider Auth provider for Twitch authentication
	 */
	constructor(authProvider?: AuthProvider) {
		super();

		this.authProvider = authProvider;
		if (authProvider && !authProvider.getAccessTokenForIntent) {
			throw new InvalidTokenTypeError(
				"You can not connect to chat using an AuthProvider that does not support intents.",
			);
		}
	}

	/**
	 * A promise that resolves when the client is authenticated and ready to send commands.
	 * It resolves immediately if the client is already authenticated.
	 */
	get ready(): Promise<void> {
		if (this.ws && this.authenticated) {
			return Promise.resolve();
		}

		return this.once("ready");
	}

	/**
	 * Connect to Twitch IRC WebSocket server
	 */
	public connect(): void {
		if (this.ws) {
			return; // Already connected or connecting
		}

		this.intentionalDisconnect = false;
		this.authenticated = false;
		this.emit("connecting");

		// Create a new WebSocket connection
		this.ws = new WebSocket(this.url);

		// Connection opened
		this.ws.onopen = async () => {
			this.emit("connected");
			this.reconnectAttempts = 0;

			try {
				this.send("CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership");
				await this.authenticate();
			} catch (error) {
				this.emit("error", error instanceof Error ? error : new Error(String(error)));
				this.disconnect(false);
			}
		};

		// Listen for messages
		this.ws.onmessage = (event) => {
			this.handleMessage(event.data);
		};

		// Handle errors
		this.ws.onerror = (error) => {
			this.emit("error", new Error("WebSocket error"));
		};

		// Connection closed
		this.ws.onclose = () => {
			this.cleanup();
			this.emit("disconnected");

			// Only attempt to reconnect if this wasn't an intentional disconnect
			if (!this.intentionalDisconnect) {
				this.attemptReconnect();
			}
		};
	}

	/**
	 * Generate a random anonymous username
	 */
	private generateAnonymousNick(): string {
		return `justinfan${Math.floor(Math.random() * 100000)}`;
	}

	/**
	 * Authenticate with Twitch using the auth provider
	 */
	private async authenticate(): Promise<void> {
		if (this.authProvider) {
			// Try to get token from auth provider
			const authToken = await this.authProvider.getAccessTokenForIntent!("chat", [
				"chat:read",
				"chat:edit",
			]);

			if (!authToken) {
				throw new Error("No token available for chat intent");
			}

			// Get token info
			const info = await getTokenInfo(authToken.accessToken);
			if (!info.userName) {
				throw new Error("No user name available for access token");
			}

			// Send authentication commands
			this.send(`PASS oauth:${authToken.accessToken}`);
			this.send(`NICK ${info.userName}`);
		} else {
			// Fall back to anonymous mode
			const anonymousName = this.generateAnonymousNick();
			this.send(`NICK ${anonymousName}`);
		}
	}

	/**
	 * Disconnect from Twitch IRC
	 */
	public disconnect(intentional = true): void {
		if (!this.ws) {
			return;
		}

		// Mark this as an intentional disconnect to prevent automatic reconnection
		this.intentionalDisconnect = intentional;

		// Send QUIT message and close the connection
		this.send("QUIT");
		this.ws.close();
	}

	/**
	 * Join a Twitch channel
	 * @param channel Channel name (without the # prefix)
	 */
	public join(channel: string): void {
		const normalizedChannel = channel.toLowerCase();
		this.channels.add(normalizedChannel);

		if (this.authenticated) {
			this.send(`JOIN #${normalizedChannel}`);
		}
	}

	/**
	 * Leave a Twitch channel
	 * @param channel Channel name (without the # prefix)
	 */
	public part(channel: string): void {
		const normalizedChannel = channel.toLowerCase();
		this.channels.delete(normalizedChannel);

		if (this.authenticated) {
			this.send(`PART #${normalizedChannel}`);
		}
	}

	/**
	 * Send a message to a channel
	 * @param channel Channel name (without the # prefix)
	 * @param message Message to send
	 */
	public say(channel: string, message: string): void {
		const normalizedChannel = channel.toLowerCase();
		this.send(`PRIVMSG #${normalizedChannel} :${message}`);
	}

	/**
	 * Send a raw IRC command
	 * @param message Raw IRC command
	 */
	private send(message: string): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(message);
		}
	}

	/**
	 * Handle incoming WebSocket messages
	 * @param data Raw message data
	 */
	private handleMessage(data: string): void {
		// Split messages if multiple are received at once (delimited by \r\n)
		const messages = data.toString().split("\r\n").filter(Boolean);

		for (const msg of messages) {
			// Handle PING message
			if (msg.startsWith("PING")) {
				this.send(`PONG${msg.substring(4)}`);
				continue;
			}

			try {
				// @ts-expect-error: tekko doesn't accept undefined for message tags.
				const parsed = parse<TwitchIrcTags>(msg);

				// Handle authentication success
				if (parsed.command === "001") {
					this.authenticated = true;
					this.emit("ready");

					// Join channels if we have any
					for (const channel of this.channels) {
						this.join(channel);
					}

					continue;
				}

				// Handle authentication failure
				if (
					parsed.command === "NOTICE" &&
					(parsed.params?.[1] === "Login authentication failed" ||
						parsed.params?.[1] === "Improperly formatted AUTH" ||
						parsed.params?.[1] === "Invalid NICK")
				) {
					this.emit("error", new Error(parsed.params?.[1] || "Authentication failed"));
					this.disconnect(false);
					continue;
				}

				// Handle RECONNECT message from Twitch
				if (parsed.command === "RECONNECT") {
					this.disconnect(false);
					continue;
				}

				// Emit the parsed message
				this.emit("message", parsed);
			} catch (err) {
				this.emit("error", new Error(`Failed to parse message: ${msg}`));
			}
		}
	}

	/**
	 * Clean up resources when disconnected
	 */
	private cleanup(): void {
		if (this.reconnectTimeout !== null) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		this.ws = null;
	}

	/**
	 * Attempt to reconnect with exponential backoff
	 * @param immediate Whether to reconnect immediately
	 */
	private attemptReconnect(immediate = false): void {
		if (this.reconnectTimeout !== null) {
			clearTimeout(this.reconnectTimeout);
		}

		// Calculate backoff time
		const backoff = immediate
			? 0
			: Math.min(
					this.maxReconnectInterval,
					this.reconnectInterval * this.reconnectMultiplier ** this.reconnectAttempts,
				);

		this.reconnectAttempts++;
		this.emit("reconnecting", { attempt: this.reconnectAttempts, backoff });

		// @ts-expect-error: Timeout is a Node.js thing.
		this.reconnectTimeout = setTimeout(() => {
			this.connect();
		}, backoff);
	}
}
