import type { Theme, ThemeAsset, ThemeGroup } from "../themes";

/** What the overlay is asked to draw and play for one keystroke. */
export type Burst = {
	/** Window-local position, in CSS pixels. */
	position: { x: number; y: number };
	/** How many sprites to spray. Raven's original range is 5..15. */
	count: number;
	/** Sprite images, correlated with `sound` - same group, so a voice gets its own photos. */
	images: ThemeAsset[];
	/** The clip to play, or null when the chosen group has no sound. */
	sound: ThemeAsset | null;
	/** Display scale factor, so the renderer can size sprites without guessing. */
	scaleFactor: number;
};

export type KeyPress = {
	/** The character that was typed, used to look up a per-key override. */
	char: string;
	/** Cursor position within the target window, in CSS pixels. */
	position: { x: number; y: number };
	scaleFactor: number;
};

/** Mutable runtime state. Raven kept this in module-level globals. */
export type State = {
	theme: Theme | null;
	themeNames: string[];
	/** Recently drawn groups, newest first, so the same person never comes back to back. */
	recentGroups: string[];
	/** Recently played, newest first, so the same clip never repeats back to back. */
	recentSounds: string[];
	recentImages: string[];
};

export type PickedGroup = {
	group: ThemeGroup;
	/** True when the group came from a per-key override rather than the global pool. */
	fromKeyOverride: boolean;
};

export const MIN_SPRITES = 5;
export const MAX_SPRITES = 15;
export const MAX_IMAGES_PER_BURST = 3;
/** How many recent picks to remember before allowing a repeat. */
export const HISTORY_SIZE = 8;
/**
 * How many groups to keep out of the draw.
 *
 * Every person's folder holds a single clip, so the per-asset history can never offer an
 * alternative once that clip is in it - a repeat is only avoidable at the group level.
 * Kept small on purpose: the draw should still feel random, not like a tour de table.
 */
export const GROUP_HISTORY_SIZE = 2;
