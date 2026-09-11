import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { newThemeStore, type Options } from "./index";

export const ASSET_BASE_URL = "views://overlay/themes";

/** Writes a real theme tree to a temp dir - the data layer is tested against real files. */
export async function themesRootFactory(
	tree: Record<string, string[]>,
): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), "raven-themes-"));
	for (const [dir, files] of Object.entries(tree)) {
		await mkdir(join(root, dir), { recursive: true });
		for (const file of files) await writeFile(join(root, dir, file), "x");
	}
	return root;
}

export async function themeStoreFactory(
	tree: Record<string, string[]>,
	overrides: Partial<Options> = {},
) {
	const themesRoot = await themesRootFactory(tree);
	const store = newThemeStore({
		themesRoot,
		settingsPath: join(themesRoot, "..", `raven-settings-${Date.now()}-${Math.random()}.json`),
		assetBaseUrl: ASSET_BASE_URL,
		...overrides,
	});
	return { store, themesRoot };
}

/** Mirrors the real `assets/themes/raven` shape: correlated groups plus per-key overrides. */
export const RAVEN_TREE: Record<string, string[]> = {
	raven: ["intro.m4a"],
	"raven/global": ["loose.png", "loose.m4a"],
	"raven/global/gael": ["gael-1.png", "gael-2.png", "gael.m4a"],
	"raven/global/manu": ["manu.webp", "manu.m4a"],
	"raven/a": ["manu-a.m4a", "manu-a.png"],
	toad: ["intro.m4a"],
	"toad/global/toad": ["toad.png", "toad.m4a"],
};
