import { extractUserName, type UserNameResolvable } from "@twurple/api";

export type SubAgeResponse = {
	followedAt: string | null;
	statusHidden: boolean;
} & SubAge;

type SubAge =
	| { meta?: { tier: string }; cumulative: { months: number } }
	| { meta: undefined; cumulative: undefined };

export async function fetchSubAge(user: UserNameResolvable, broadcaster: UserNameResolvable) {
	const res = await fetch(
		`https://api.ivr.fi/v2/twitch/subage/${extractUserName(user)}/${extractUserName(broadcaster)}`,
	);

	if (!res.ok) throw new Error("Could not fetch sub age");
	return (await res.json()) as SubAgeResponse;
}
