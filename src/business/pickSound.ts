import type { ThemeAsset, ThemeGroup } from "../themes";
import { HISTORY_SIZE } from "./types";
import type { Deps } from "./deps";

/**
 * Pick a clip from `group`, avoiding anything played recently.
 *
 * Returns null for a group with no sounds. Raven's original reset its history and called
 * itself unconditionally in that case, so an image-only folder blew the stack.
 */
export function pickSound(deps: Deps, group: ThemeGroup): ThemeAsset | null {
	if (group.sounds.length === 0) return null;

	const { state, random } = deps;
	const fresh = group.sounds.filter((s) => !state.recentSounds.includes(s.rel));
	// Every clip played recently: allow repeats again rather than returning nothing.
	const candidates = fresh.length > 0 ? fresh : group.sounds;
	const chosen = candidates[Math.floor(random() * candidates.length)] ?? candidates[0]!;

	state.recentSounds = [chosen.rel, ...state.recentSounds].slice(0, HISTORY_SIZE);
	return chosen;
}
