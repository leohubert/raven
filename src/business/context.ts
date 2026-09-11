/** Per-event data. Mirrors the fleet's Context, minus anything request-scoped. */
export type Context = {
	now: Date;
};

export function newContext(now: Date = new Date()): Context {
	return { now };
}
