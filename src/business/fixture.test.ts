import { newBusiness, newContext, type Options } from "./index";
import { nativeMock } from "../native/mock.test";
import type { Settings, Theme } from "../themes";
import { themeMock } from "./mock.test";

/** A ThemeStore stub - business tests never touch the filesystem. */
export function themeStoreFixture(themes: Theme[] = [themeMock()]) {
	let settings: Settings = { theme: null };
	const calls = { updates: [] as Partial<Settings>[], pushed: [] as Theme[] };
	return {
		calls,
		get settings() {
			return settings;
		},
		store: {
			ListThemes: async () => themes.map((t) => t.name),
			GetTheme: async (name: string) => {
				const found = themes.find((t) => t.name === name);
				if (!found) throw new Error(`theme not found: ${name}`);
				return found;
			},
			GetAsset: async (rel: string) => new TextEncoder().encode(rel),
			UpsertPushedTheme: (theme: Theme) => {
				calls.pushed.push(theme);
				// Unshifted, not appended: a pushed theme shadows the disk theme of the same
				// name, exactly as the real store does.
				themes.unshift(theme);
			},
			GetSettings: async () => settings,
			UpdateSettings: async (patch: Partial<Settings>) => {
				calls.updates.push(patch);
				settings = { ...settings, ...patch };
				return settings;
			},
		},
	};
}

/** Deterministic by default: `random` returns 0, so every pick is the first candidate. */
export function optionsFixture(overrides: Partial<Options> = {}) {
	return {
		themes: themeStoreFixture().store,
		native: nativeMock(),
		random: () => 0,
		...overrides,
	} satisfies Options;
}

export function contextFixture(now = new Date("2026-09-09T12:00:00Z")) {
	return newContext(now);
}

export function businessFixture(overrides: Partial<Options> = {}) {
	const opts = optionsFixture(overrides);
	return { business: newBusiness(opts), opts, ctx: contextFixture() };
}
