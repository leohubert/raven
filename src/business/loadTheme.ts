import type { Theme } from "../themes";
import type { Context } from "./context";
import type { Deps } from "./deps";
import { NoThemesAvailableError } from "./error";

/**
 * Load a theme by name, or restore the persisted one, or pick at random.
 *
 * The selection is persisted, which the original never did - it hardcoded `raven` on
 * every start.
 */
export async function loadTheme(
	deps: Deps,
	_ctx: Context,
	req: { name?: string } = {},
): Promise<Theme> {
	const { themes, state, random } = deps;

	state.themeNames = await themes.ListThemes();
	if (state.themeNames.length === 0) throw new NoThemesAvailableError();

	const saved = req.name ? null : (await themes.GetSettings()).theme;
	const wanted = req.name ?? saved ?? null;
	const name =
		wanted && state.themeNames.includes(wanted)
			? wanted
			: state.themeNames[Math.floor(random() * state.themeNames.length)]!;

	const theme = await themes.GetTheme(name);
	state.theme = theme;
	state.recentGroups = [];
	state.recentSounds = [];
	state.recentImages = [];
	await themes.UpdateSettings({ theme: name });
	return theme;
}
