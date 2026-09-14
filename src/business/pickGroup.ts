import { GROUP_HISTORY_SIZE, type PickedGroup } from "./types";
import type { Deps } from "./deps";
import { NoThemeLoadedError } from "./error";

/**
 * Choose which pool a keystroke draws from.
 *
 * A directory named after the typed character wins outright - that is how
 * `assets/themes/toad/a/` makes pressing `a` always play `manu-a.m4a`. Otherwise pick a
 * random group from the theme-wide pool, ignoring groups that hold nothing usable and the
 * last `GROUP_HISTORY_SIZE` groups drawn.
 *
 * The history lives here rather than only in pickSound/pickImages because a group is one
 * person's folder and usually holds a single clip: drawing the same group twice in a row
 * replays that clip whatever the asset-level history says.
 */
export function pickGroup(deps: Deps, char: string): PickedGroup {
	const { state, random } = deps;
	const theme = state.theme;
	if (!theme) throw new NoThemeLoadedError();

	const override = theme.keys[char];
	if (override && (override.sounds.length > 0 || override.images.length > 0)) {
		return { group: override, fromKeyOverride: true };
	}

	const usable = theme.groups.filter((g) => g.sounds.length > 0 || g.images.length > 0);
	if (usable.length === 0) {
		return { group: { name: "", sounds: [], images: [] }, fromKeyOverride: false };
	}
	// Clamped so a theme with one or two groups still has something to draw from.
	const remember = Math.min(GROUP_HISTORY_SIZE, usable.length - 1);
	const fresh = usable.filter((g) => !state.recentGroups.includes(g.name));
	const candidates = fresh.length > 0 ? fresh : usable;
	const group = candidates[Math.floor(random() * candidates.length)] ?? candidates[0]!;

	state.recentGroups = [group.name, ...state.recentGroups].slice(0, remember);
	return { group, fromKeyOverride: false };
}
