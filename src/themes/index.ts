import { GetSettings, UpdateSettings } from "./settings";
import { ListThemeNames, ReadTheme } from "./scan";
import type { Options } from "./options";
import type { Settings, Theme } from "./types";

export type { Options } from "./options";
export type {
	AssetKind,
	Settings,
	Theme,
	ThemeAsset,
	ThemeGroup,
} from "./types";

/**
 * The data layer. Raven has no database - the themes tree on disk *is* the schema, and
 * it is re-read on demand rather than cached, so dropping a folder in `assets/themes`
 * is all it takes to add a theme.
 */
export function newThemeStore(opts: Options) {
	return {
		ListThemes: (): Promise<string[]> => ListThemeNames(opts.themesRoot),
		GetTheme: (name: string): Promise<Theme> =>
			ReadTheme(opts.themesRoot, name, opts.assetBaseUrl),
		GetSettings: (): Promise<Settings> => GetSettings(opts.settingsPath),
		UpdateSettings: (patch: Partial<Settings>): Promise<Settings> =>
			UpdateSettings(opts.settingsPath, patch),
	};
}

export type ThemeStore = ReturnType<typeof newThemeStore>;
