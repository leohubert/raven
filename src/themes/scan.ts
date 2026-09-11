import { readdir, stat } from "node:fs/promises";
import { join, posix } from "node:path";

import {
	IMAGE_EXTENSIONS,
	SOUND_EXTENSIONS,
	type AssetKind,
	type Theme,
	type ThemeAsset,
	type ThemeGroup,
} from "./types";

const GLOBAL_DIR = "global";
const INTRO_BASENAME = "intro";

function getAssetKind(name: string): AssetKind | null {
	const lower = name.toLowerCase();
	if (SOUND_EXTENSIONS.some((e) => lower.endsWith(e))) return "sound";
	if (IMAGE_EXTENSIONS.some((e) => lower.endsWith(e))) return "image";
	return null;
}

async function listDirectories(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
	return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

/**
 * Collect every asset under `dir`, recursing into subdirectories.
 *
 * Raven's original `getFiles(dir, recursive)` dropped the flag on its recursive call, so
 * the parameter only ever worked by accident. Recursion here is unconditional and total,
 * which is what every caller actually wanted.
 */
async function collectAssets(
	root: string,
	dir: string,
	assetBaseUrl: string,
): Promise<ThemeAsset[]> {
	const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
	const found: ThemeAsset[] = [];
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			found.push(...(await collectAssets(root, full, assetBaseUrl)));
			continue;
		}
		const kind = getAssetKind(entry.name);
		if (!kind) continue;
		const rel = posix.join(...full.slice(root.length + 1).split(/[\\/]/));
		found.push({ rel, url: `${assetBaseUrl}/${rel}`, kind });
	}
	return dedupeImageFormats(found);
}

/** Most preferred first. `optimize-images` writes .webp beside the .png it converted. */
const IMAGE_FORMAT_PREFERENCE = [".webp", ".png", ".gif"];

/**
 * Collapse the same logical image stored in several formats down to one.
 *
 * The upstream asset pipeline wrote `.webp` next to every `.png` and deleted nothing, so
 * a naive scan puts each picture in the pool twice - which skews the random pick towards
 * duplicated images and doubles the bundle. Keyed on directory + basename, so two
 * genuinely different pictures never collide.
 */
function dedupeImageFormats(assets: ThemeAsset[]): ThemeAsset[] {
	const best = new Map<string, ThemeAsset>();
	const passthrough: ThemeAsset[] = [];

	for (const asset of assets) {
		if (asset.kind !== "image") {
			passthrough.push(asset);
			continue;
		}
		const dot = asset.rel.lastIndexOf(".");
		const stem = asset.rel.slice(0, dot);
		const ext = asset.rel.slice(dot).toLowerCase();
		const incumbent = best.get(stem);
		if (!incumbent) {
			best.set(stem, asset);
			continue;
		}
		const incumbentExt = incumbent.rel.slice(incumbent.rel.lastIndexOf(".")).toLowerCase();
		const rank = (e: string) => {
			const i = IMAGE_FORMAT_PREFERENCE.indexOf(e);
			return i === -1 ? IMAGE_FORMAT_PREFERENCE.length : i;
		};
		if (rank(ext) < rank(incumbentExt)) best.set(stem, asset);
	}

	return [...passthrough, ...best.values()].sort((a, b) => a.rel.localeCompare(b.rel));
}

function toGroup(name: string, assets: ThemeAsset[]): ThemeGroup {
	return {
		name,
		sounds: assets.filter((a) => a.kind === "sound"),
		images: assets.filter((a) => a.kind === "image"),
	};
}

export async function ListThemeNames(themesRoot: string): Promise<string[]> {
	return listDirectories(themesRoot);
}

export async function ReadTheme(
	themesRoot: string,
	name: string,
	assetBaseUrl: string,
): Promise<Theme> {
	const themeDir = join(themesRoot, name);
	if (!(await stat(themeDir).catch(() => null))?.isDirectory()) {
		throw new Error(`theme not found: ${name}`);
	}

	const topLevel = await collectAssets(themesRoot, themeDir, assetBaseUrl);
	const intro = topLevel.filter(
		(a) => a.kind === "sound" && a.rel.split("/").at(-1)?.startsWith(INTRO_BASENAME),
	);

	// global/ holds the theme-wide pool: loose files become the "" group, each
	// subdirectory becomes its own correlated group.
	const globalDir = join(themeDir, GLOBAL_DIR);
	const globalAssets = await collectAssets(themesRoot, globalDir, assetBaseUrl);
	const globalSubdirs = await listDirectories(globalDir);
	const groups: ThemeGroup[] = [
		toGroup(
			"",
			globalAssets.filter((a) => a.rel.split("/").length === 3),
		),
	];
	for (const sub of globalSubdirs) {
		const prefix = `${name}/${GLOBAL_DIR}/${sub}/`;
		groups.push(toGroup(sub, globalAssets.filter((a) => a.rel.startsWith(prefix))));
	}

	// Any other top-level directory is a per-key override keyed by the typed character.
	const keys: Record<string, ThemeGroup> = {};
	for (const dir of await listDirectories(themeDir)) {
		if (dir === GLOBAL_DIR) continue;
		keys[dir] = toGroup(dir, await collectAssets(themesRoot, join(themeDir, dir), assetBaseUrl));
	}

	return { name, intro, groups, keys };
}
