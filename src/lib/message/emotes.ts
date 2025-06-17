import { extractUserId, type UserIdResolvable } from "@twurple/api";

export type Provider = "bttv" | "ffz";

export interface ThirdPartyEmote {
	name: string;
	imageUrl: string;
	aspectRatio: number;
}

// -- BTTV
interface BttvEmote {
	id: string;
	code: string;
	imageType: string;
	width?: number;
	height?: number;
}

function parseBttvEmotes(emotes: BttvEmote[]): Record<string, ThirdPartyEmote> {
	return Object.fromEntries(
		emotes.map((emote) => [
			emote.code,
			{
				name: emote.code,
				imageUrl: `https://cdn.betterttv.net/emote/${emote.id}/2x.${emote.imageType}`,
				aspectRatio: emote.width && emote.height ? emote.width / emote.height : 1,
			},
		]),
	);
}

async function fetchBttvChannelEmotes(
	user: UserIdResolvable,
): Promise<Record<string, ThirdPartyEmote>> {
	const url = `https://api.betterttv.net/3/cached/users/twitch/${extractUserId(user)}`;
	const response = await fetch(url);

	const res = await response.json();
	if (!response.ok) throw new Error(`failed to fetch BTTV channel emotes: ${res.message}`);

	const data: { channelEmotes: BttvEmote[]; sharedEmotes: BttvEmote[] } = res;
	return parseBttvEmotes([...data.channelEmotes, ...data.sharedEmotes]);
}

async function fetchBttvGlobalEmotes(): Promise<Record<string, ThirdPartyEmote>> {
	const url = "https://api.betterttv.net/3/cached/emotes/global";
	const response = await fetch(url);

	const res = await response.json();
	if (!response.ok) throw new Error(`failed to fetch BTTV global emotes: ${res.message}`);

	const data: BttvEmote[] = res;
	return parseBttvEmotes(data);
}

// -- FFZ
interface FfzEmoteSet {
	emoticons: {
		name: string;
		width: number;
		height: number;
		animated?: Record<string, string>;
		urls: Record<string, string>;
	}[];
}

function parseFfzEmotes(sets: FfzEmoteSet[]): Record<string, ThirdPartyEmote> {
	return Object.fromEntries(
		sets.flatMap((set) =>
			set.emoticons.map((emote) => [
				emote.name,
				{
					name: emote.name,
					imageUrl: emote.animated?.["2"] ?? emote.urls["2"],
					aspectRatio: emote.width / emote.height,
				},
			]),
		),
	);
}

async function fetchFfzChannelEmotes(
	user: UserIdResolvable,
): Promise<Record<string, ThirdPartyEmote>> {
	const url = `https://api.frankerfacez.com/v1/room/id/${extractUserId(user)}`;
	const response = await fetch(url);

	const res = await response.json();
	if (!response.ok) throw new Error(`failed to fetch FFZ channel emotes: ${res.message}`);

	const data: { sets: Record<string, FfzEmoteSet> } = res;
	return parseFfzEmotes(Object.values(data.sets));
}

async function fetchFfzGlobalEmotes(): Promise<Record<string, ThirdPartyEmote>> {
	const url = "https://api.frankerfacez.com/v1/set/global";
	const response = await fetch(url);

	const res = await response.json();
	if (!response.ok) throw new Error(`failed to fetch FFZ global emotes: ${res.message}`);

	const data: { default_sets: number[]; sets: Record<string, FfzEmoteSet> } = res;
	const sets = data.default_sets.map((set) => data.sets[set]);
	return parseFfzEmotes(sets);
}

// -- COMBINED
export async function fetchChannelEmotes(
	user: UserIdResolvable,
	providers: Provider[] = ["bttv", "ffz"],
): Promise<Record<string, ThirdPartyEmote>> {
	const fetchers = {
		// FIXME: handle these errors properly.
		bttv: () => fetchBttvChannelEmotes(user).catch(console.warn),
		ffz: () => fetchFfzChannelEmotes(user).catch(console.warn),
	};

	const results = await Promise.all(providers.map((provider) => fetchers[provider]()));
	return Object.assign({}, ...results);
}

export async function fetchGlobalEmotes(
	providers: Provider[] = ["bttv", "ffz"],
): Promise<Record<string, ThirdPartyEmote>> {
	const fetchers = {
		// FIXME: handle these errors properly.
		bttv: () => fetchBttvGlobalEmotes().catch(console.warn),
		ffz: () => fetchFfzGlobalEmotes().catch(console.warn),
	};

	const results = await Promise.all(providers.map((provider) => fetchers[provider]()));
	return Object.assign({}, ...results);
}
