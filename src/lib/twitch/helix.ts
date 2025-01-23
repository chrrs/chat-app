import type { TwitchAuth } from "./client";

export class HelixClient {
	auth: TwitchAuth;

	constructor(auth: TwitchAuth) {
		this.auth = auth;
	}

	fetch = async (path: string, options?: RequestInit) =>
		await fetch(`https://api.twitch.tv/helix/${path}`, {
			headers: {
				Authorization: `Bearer ${this.auth.authToken}`,
				"Client-Id": this.auth.clientId,
				"Content-Type": "application/json",
				...options?.headers,
			},
			...options,
		});

	safeFetch = async (path: string, options?: RequestInit) => {
		const res = await this.fetch(path, options);

		if (Math.floor(res.status / 100) !== 2) {
			const body = await res.json();
			const message = body.message || body.error || res.statusText;

			console.warn(`API error for ${path}: ${message}`);
			throw new Error(`API error for ${path}: ${message}`, { cause: res });
		}

		return res;
	};

	get = this.safeFetch;
	post = (path: string, options?: RequestInit) =>
		this.safeFetch(path, { method: "POST", ...options });
	delete = (path: string, options?: RequestInit) =>
		this.safeFetch(path, { method: "DELETE", ...options });
}
