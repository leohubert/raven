import type { Theme, ThemeStore } from "../../src/themes";
import type { Pool } from "./index";
import type { CommandResult, PushableAsset } from "./types";

export type Options = { pool: Pool; themes: ThemeStore };

/** Only what a theme can hold - the webview needs a real type to build a playable Blob. */
const MIME_TYPES: Record<string, string> = {
	".m4a": "audio/mp4",
	".mp3": "audio/mpeg",
	".wav": "audio/wav",
	".ogg": "audio/ogg",
	".png": "image/png",
	".webp": "image/webp",
	".gif": "image/gif",
};

function getMimeType(rel: string): string {
	return MIME_TYPES[rel.slice(rel.lastIndexOf(".")).toLowerCase()] ?? "application/octet-stream";
}

/** Deduplicated and sorted, so `total` is honest and two pushes of one theme look alike. */
function listAssetRels(theme: Theme): string[] {
	const groups = [...theme.groups, ...Object.values(theme.keys)];
	const rels = new Set(theme.intro.map((a) => a.rel));
	for (const group of groups) {
		for (const asset of [...group.sounds, ...group.images]) rels.add(asset.rel);
	}
	return [...rels].sort();
}

/**
 * Ship a whole theme to one client over its control stream.
 *
 * Everything is read before anything is sent: a push that fails halfway would leave the
 * client holding a theme it can never complete, and the operator with an accepted command
 * that silently did nothing.
 */
export async function PushTheme(
	opts: Options,
	req: { clientId: string; theme: string },
): Promise<CommandResult> {
	let theme: Theme;
	let assets: PushableAsset[];
	try {
		theme = await opts.themes.GetTheme(req.theme);
		assets = await Promise.all(
			listAssetRels(theme).map(async (rel) => ({
				rel,
				mime: getMimeType(rel),
				bytes: await opts.themes.GetAsset(rel),
			})),
		);
	} catch (error) {
		return { accepted: false, error: `could not read theme ${req.theme}: ${String(error)}` };
	}

	return opts.pool.SendCommand({ clientId: req.clientId, action: { case: "push", theme, assets } });
}
