import type { Display, OverlayTarget, Point } from "./types";

/**
 * Find the display under the cursor and convert to window-local coordinates.
 *
 * Coordinates are returned in CSS pixels and paired with the display's own
 * `scaleFactor`, so the renderer never has to guess. Raven multiplied by a hardcoded 2,
 * which is only correct on a 2x display and silently wrong on any other.
 */
export function getTargetForCursor(
	displays: Display[],
	cursor: Point,
): OverlayTarget | null {
	for (const display of displays) {
		const { x, y, width, height } = display.bounds;
		const inside =
			cursor.x >= x && cursor.x < x + width && cursor.y >= y && cursor.y < y + height;
		if (!inside) continue;
		return {
			displayId: display.id,
			position: { x: cursor.x - x, y: cursor.y - y },
			scaleFactor: display.scaleFactor,
		};
	}
	return null;
}
