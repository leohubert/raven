import type { Context } from "./context";
import type { Deps } from "./deps";
import { pickGroup } from "./pickGroup";
import { pickImages } from "./pickImages";
import { pickSound } from "./pickSound";
import { MAX_SPRITES, MIN_SPRITES, type Burst, type KeyPress } from "./types";

/**
 * The core of raven: turn one keystroke into a burst.
 *
 * Returns null when there is nothing to show, so the transport layer can simply do
 * nothing rather than sending an empty burst to the renderer.
 */
export function onKeyPressed(deps: Deps, _ctx: Context, req: KeyPress): Burst | null {
	const { group } = pickGroup(deps, req.char);
	const sound = pickSound(deps, group);
	const images = pickImages(deps, group);
	if (!sound && images.length === 0) return null;

	const span = MAX_SPRITES - MIN_SPRITES + 1;
	return {
		position: req.position,
		count: images.length === 0 ? 0 : MIN_SPRITES + Math.floor(deps.random() * span),
		images,
		sound,
		scaleFactor: req.scaleFactor,
	};
}
