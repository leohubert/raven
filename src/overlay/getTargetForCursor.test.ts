import { describe, expect, it } from "bun:test";

import { getTargetForCursor } from "./getTargetForCursor";
import type { Display } from "./types";

// The real layout on the development machine: primary centre, laptop right, third left.
const DISPLAYS: Display[] = [
	{ id: 5, bounds: { x: 0, y: 0, width: 2560, height: 1440 }, scaleFactor: 2, isPrimary: true },
	{ id: 1, bounds: { x: 2560, y: 0, width: 1512, height: 982 }, scaleFactor: 2, isPrimary: false },
	{ id: 4, bounds: { x: -2560, y: 0, width: 2560, height: 1440 }, scaleFactor: 1, isPrimary: false },
];

describe("overlay", () => {
	describe("getTargetForCursor", () => {
		it("Should pick the display the cursor is on", () => {
			expect(getTargetForCursor(DISPLAYS, { x: 100, y: 100 })?.displayId).toBe(5);
			expect(getTargetForCursor(DISPLAYS, { x: 3000, y: 100 })?.displayId).toBe(1);
		});

		it("Should convert to window-local coordinates, so the burst lands at the cursor and not offset by the display origin", () => {
			const target = getTargetForCursor(DISPLAYS, { x: 3018, y: 675 });
			expect(target?.position).toEqual({ x: 458, y: 675 });
		});

		it("Should handle displays at negative origins, which a screen to the left of the primary always has", () => {
			const target = getTargetForCursor(DISPLAYS, { x: -2000, y: 300 });
			expect(target?.displayId).toBe(4);
			expect(target?.position).toEqual({ x: 560, y: 300 });
		});

		it("Should report the display's own scaleFactor rather than assuming 2", () => {
			// raven hardcoded `mousePosition.x * 2`, which is wrong on any non-2x screen
			expect(getTargetForCursor(DISPLAYS, { x: -2000, y: 300 })?.scaleFactor).toBe(1);
			expect(getTargetForCursor(DISPLAYS, { x: 100, y: 100 })?.scaleFactor).toBe(2);
		});

		it("Should treat the right and bottom edges as belonging to the next display, so no cursor maps to two windows", () => {
			// x=2560 is the first pixel of display 1, not the last of display 5
			expect(getTargetForCursor(DISPLAYS, { x: 2560, y: 0 })?.displayId).toBe(1);
			expect(getTargetForCursor(DISPLAYS, { x: 2559, y: 0 })?.displayId).toBe(5);
		});

		it("Should return null when the cursor is in a gap between displays rather than guessing", () => {
			expect(getTargetForCursor(DISPLAYS, { x: 9999, y: 9999 })).toBeNull();
		});
	});
});
