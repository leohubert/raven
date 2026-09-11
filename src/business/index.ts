import { cycleTheme } from "./cycleTheme";
import { getCurrentTheme } from "./getCurrentTheme";
import { loadTheme } from "./loadTheme";
import { onKeyPressed } from "./onKeyPressed";
import type { Context } from "./context";
import type { Deps } from "./deps";
import type { Options } from "./options";
import type { Theme } from "../themes";
import type { Burst, KeyPress, State } from "./types";

export { newContext } from "./context";
export { NoThemeLoadedError, NoThemesAvailableError } from "./error";
export type { Context } from "./context";
export type { Options } from "./options";
export type { Burst, KeyPress, PickedGroup, State } from "./types";

function newState(): State {
	return {
		theme: null,
		themeNames: [],
		recentGroups: [],
		recentSounds: [],
		recentImages: [],
	};
}

/**
 * All of raven's logic. Holds the only mutable runtime state, and knows nothing about
 * Electrobun, windows, or FFI - which is what makes it testable with plain fixtures.
 */
export function newBusiness(opts: Options) {
	const deps: Deps = {
		...opts,
		state: newState(),
		random: opts.random ?? Math.random,
	};

	return {
		loadTheme: (ctx: Context, req?: { name?: string }): Promise<Theme> =>
			loadTheme(deps, ctx, req),
		cycleTheme: (ctx: Context): Promise<Theme> => cycleTheme(deps, ctx),
		getCurrentTheme: (): Theme | null => getCurrentTheme(deps),
		onKeyPressed: (ctx: Context, req: KeyPress): Burst | null =>
			onKeyPressed(deps, ctx, req),
		isHealthy: (): boolean => deps.state.theme !== null,
	};
}

export type Business = ReturnType<typeof newBusiness>;
