import type { Theme } from "../themes";
import type { Context } from "./context";
import type { Deps } from "./deps";
import { loadTheme } from "./loadTheme";

/**
 * Advance to the next theme, wrapping around.
 *
 * The original hardcoded a two-way `raven` <-> `toad` toggle and only used the discovered
 * theme list for its length.
 */
export async function cycleTheme(deps: Deps, ctx: Context): Promise<Theme> {
	const names = deps.state.themeNames.length
		? deps.state.themeNames
		: await deps.themes.ListThemes();
	const current = deps.state.theme?.name;
	const at = current ? names.indexOf(current) : -1;
	const next = names[(at + 1) % names.length];
	return loadTheme(deps, ctx, next ? { name: next } : {});
}
