import type { LayoutKey } from "./types";

/**
 * Map each character to the physical key that produces it, preferring the lowest key code.
 *
 * A character can come from two keys: `.` is keyCode 47 on the main row and 65 on the
 * keypad, and every digit appears at both 18..29 and 82..92. The main keyboard always has
 * the lower code, so taking the minimum picks it. Building the map the obvious way
 * (`new Map(keys.map(...))`) keeps whichever entry came last and silently binds the
 * numeric keypad instead.
 *
 * Deliberately independent of input order rather than trusting the table to arrive sorted.
 */
export function getLayoutIndex(keys: LayoutKey[]): Map<string, number> {
	const index = new Map<string, number>();
	for (const key of keys) {
		const existing = index.get(key.ch);
		if (existing === undefined || key.code < existing) index.set(key.ch, key.code);
	}
	return index;
}
