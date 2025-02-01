export function eMsg(e: Error | unknown): string {
	if (e instanceof Error) {
		return e.message;
	}

	return String(e);
}
