import { MODIFIER } from "../native";

export type ControlAction = "quit" | "cycleTheme" | "toggleClickThrough" | "showVersion";

export type ControlBinding = {
	action: ControlAction;
	char: string;
	modifiers: number;
	description: string;
};

/**
 * The control hotkeys, matching the original's OPTION+letter scheme.
 *
 * OPTION+P is the documented quit key, but the original had no alternative - and if the
 * combination is taken by another app there is no dock icon or menu to fall back on. A
 * second quit binding is cheap insurance.
 */
export const CONTROL_BINDINGS: ControlBinding[] = [
	{ action: "quit", char: "p", modifiers: MODIFIER.option, description: "OPTION+P quit" },
	{ action: "quit", char: "q", modifiers: MODIFIER.option, description: "OPTION+Q quit" },
	{ action: "cycleTheme", char: "t", modifiers: MODIFIER.option, description: "OPTION+T next theme" },
	{
		action: "toggleClickThrough",
		char: "m",
		modifiers: MODIFIER.option,
		description: "OPTION+M toggle click-through",
	},
	{ action: "showVersion", char: "v", modifiers: MODIFIER.option, description: "OPTION+V version" },
];

/** Characters never grabbed as bare keys, because doing so makes the machine unusable. */
export const BARE_KEY_BLOCKLIST = new Set([" ", "\t", "\n", "\r"]);
