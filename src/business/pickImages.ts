import type { ThemeAsset, ThemeGroup } from "../themes";
import { HISTORY_SIZE, MAX_IMAGES_PER_BURST } from "./types";
import type { Deps } from "./deps";

/**
 * Pick up to `MAX_IMAGES_PER_BURST` images from `group`.
 *
 * Taking them from the same group as the sound is what correlates the two - raven's joke
 * is that a colleague's voice arrives with that colleague's face.
 */
export function pickImages(deps: Deps, group: ThemeGroup): ThemeAsset[] {
	if (group.images.length === 0) return [];

	const { state, random } = deps;
	const fresh = group.images.filter((i) => !state.recentImages.includes(i.rel));
	const pool = [...(fresh.length > 0 ? fresh : group.images)];

	const picked: ThemeAsset[] = [];
	const wanted = Math.min(MAX_IMAGES_PER_BURST, pool.length);
	while (picked.length < wanted) {
		const [taken] = pool.splice(Math.floor(random() * pool.length), 1);
		if (!taken) break;
		picked.push(taken);
	}

	state.recentImages = [
		...picked.map((p) => p.rel),
		...state.recentImages,
	].slice(0, HISTORY_SIZE);
	return picked;
}
