export type AssetKind = "sound" | "image";

/** A single file in a theme. `rel` is posix-relative to the themes root. */
export type ThemeAsset = {
	rel: string;
	url: string;
	kind: AssetKind;
};

/**
 * A correlated pool of sounds and images. Raven's convention is that a sound and the
 * images beside it belong together, so "gael's voice" comes with "gael's photos".
 * The loose files directly under `global/` form the group named "".
 */
export type ThemeGroup = {
	name: string;
	sounds: ThemeAsset[];
	images: ThemeAsset[];
};

export type Theme = {
	name: string;
	/** `<theme>/intro.*` - played once when the theme loads. */
	intro: ThemeAsset[];
	/** Groups under `<theme>/global/`. Always contains the "" group, possibly empty. */
	groups: ThemeGroup[];
	/** Per-key overrides: `<theme>/<key>/` where <key> is the typed character. */
	keys: Record<string, ThemeGroup>;
};

export type Settings = {
	/** Last selected theme, or null to pick one at random. */
	theme: string | null;
};

export const SOUND_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a"] as const;
export const IMAGE_EXTENSIONS = [".png", ".webp", ".gif"] as const;
