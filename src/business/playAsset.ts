import type { Theme, ThemeAsset, ThemeGroup } from "../themes";
import type { Context } from "./context";
import type { Deps } from "./deps";
import { MAX_IMAGES_PER_BURST, MAX_SPRITES, MIN_SPRITES, type Burst } from "./types";

export type PlayAssetRequest = {
	theme: string;
	rel: string;
	position: { x: number; y: number };
	scaleFactor: number;
};

type FoundAsset = { asset: ThemeAsset; images: ThemeAsset[] };

/** Search one group's sounds and images for `rel`, pairing a hit with the group's images. */
function findInGroup(group: ThemeGroup, rel: string): FoundAsset | null {
	const asset = [...group.sounds, ...group.images].find((a) => a.rel === rel);
	return asset ? { asset, images: group.images } : null;
}

/**
 * Resolve `rel` against a theme: intro first, then every global group, then every per-key
 * override. Intro assets pair with no images - they are not part of a group.
 */
function findAsset(theme: Theme, rel: string): FoundAsset | null {
	const intro = theme.intro.find((a) => a.rel === rel);
	if (intro) return { asset: intro, images: [] };

	for (const group of theme.groups) {
		const found = findInGroup(group, rel);
		if (found) return found;
	}
	for (const group of Object.values(theme.keys)) {
		const found = findInGroup(group, rel);
		if (found) return found;
	}
	return null;
}

/**
 * Sample up to `MAX_IMAGES_PER_BURST` images without repeats within the burst, mirroring
 * pickImages' spray shape - but with no history, since a one-shot must record nothing.
 */
function sampleImages(images: ThemeAsset[], random: () => number): ThemeAsset[] {
	const pool = [...images];
	const picked: ThemeAsset[] = [];
	const wanted = Math.min(MAX_IMAGES_PER_BURST, pool.length);
	while (picked.length < wanted) {
		const [taken] = pool.splice(Math.floor(random() * pool.length), 1);
		if (!taken) break;
		picked.push(taken);
	}
	return picked;
}

/**
 * Play exactly one named asset, once, with no side effects on session state.
 *
 * Ruling E: reads the theme with `themes.GetTheme` directly, never `business.loadTheme`.
 * `loadTheme` clears `state.recentGroups`/`recentSounds`/`recentImages` and replaces the
 * active theme (see AGENTS.md, "Picking what plays, and why it does not repeat") - either
 * effect would corrupt an ACTIVE client's session over a single remote PlaySound. A theme
 * name that does not exist is treated the same as an asset that cannot be found: `null`,
 * not a thrown error, since the alternative would surface as a dropped connection rather
 * than an honest Ack.
 */
export async function playAsset(deps: Deps, _ctx: Context, req: PlayAssetRequest): Promise<Burst | null> {
	const theme = await deps.themes.GetTheme(req.theme).catch(() => null);
	if (!theme) return null;

	const found = findAsset(theme, req.rel);
	if (!found) return null;

	const images = sampleImages(found.images, deps.random);
	return {
		position: req.position,
		count: images.length === 0 ? 0 : MIN_SPRITES + Math.floor(deps.random() * (MAX_SPRITES - MIN_SPRITES + 1)),
		images,
		sound: found.asset,
		scaleFactor: req.scaleFactor,
	};
}
