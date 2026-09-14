import { GetSettings, UpdateSettings } from "./settings";
import { ListThemeNames, ReadAsset, ReadTheme } from "./scan";
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
	// Themes pushed over the control stream are held here and nowhere else: the app bundle
	// is signed and read-only, so a theme that arrives at runtime cannot be written into
	// the tree on disk. It is therefore gone on restart - documented behaviour, not a bug.
	const pushed = new Map<string, Theme>();

	return {
		ListThemes: async (): Promise<string[]> => {
			const names = new Set(await ListThemeNames(opts.themesRoot));
			for (const name of pushed.keys()) names.add(name);
			return [...names].sort();
		},
		// A pushed theme shadows the disk theme of the same name, which is what pushing an
		// edited theme is for.
		GetTheme: (name: string): Promise<Theme> => {
			const received = pushed.get(name);
			return received
				? Promise.resolve(received)
				: ReadTheme(opts.themesRoot, name, opts.assetBaseUrl);
		},
		GetAsset: (rel: string): Promise<Uint8Array> => ReadAsset(opts.themesRoot, rel),
		UpsertPushedTheme: (theme: Theme): void => {
			pushed.set(theme.name, theme);
		},
		GetSettings: (): Promise<Settings> => GetSettings(opts.settingsPath),
		UpdateSettings: (patch: Partial<Settings>): Promise<Settings> =>
			UpdateSettings(opts.settingsPath, patch),
	};
}

export type ThemeStore = ReturnType<typeof newThemeStore>;
