import { describe, expect, it } from "bun:test";

import {
	advanceSprites,
	getSpriteOpacity,
	spawnSprites,
	FADE_SECONDS,
	SPRITE_SIZE,
	type Sprite,
} from "./particles";

const sources = ["views://overlay/themes/raven/global/gael/1.png"];

describe("overlay particles", () => {
	describe("spawnSprites", () => {
		it("Should spawn exactly the requested count at the cursor", () => {
			const sprites = spawnSprites({ x: 100, y: 200, count: 7, sources, random: () => 0.5 });
			expect(sprites).toHaveLength(7);
			for (const s of sprites) expect([s.x, s.y]).toEqual([100, 200]);
		});

		it("Should launch upward, so the burst arcs rather than dropping straight down", () => {
			const sprites = spawnSprites({ x: 0, y: 0, count: 5, sources, random: () => 0.5 });
			// canvas y grows downward, so upward is negative
			for (const s of sprites) expect(s.vy).toBeLessThan(0);
		});

		it("Should spread horizontally in both directions rather than all one way", () => {
			const left = spawnSprites({ x: 0, y: 0, count: 1, sources, random: () => 0 })[0]!;
			const right = spawnSprites({ x: 0, y: 0, count: 1, sources, random: () => 0.99 })[0]!;
			expect(left.vx).toBeLessThan(0);
			expect(right.vx).toBeGreaterThan(0);
		});

		it("Should spawn nothing when the theme group had no images, instead of drawing blanks", () => {
			expect(spawnSprites({ x: 0, y: 0, count: 10, sources: [], random: () => 0 })).toEqual([]);
			expect(spawnSprites({ x: 0, y: 0, count: 0, sources, random: () => 0 })).toEqual([]);
		});
	});

	describe("advanceSprites", () => {
		const sprite = (over: Partial<Sprite> = {}): Sprite => ({
			x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, age: 0, src: sources[0]!, ...over,
		});

		it("Should apply gravity, so a sprite launched upward eventually comes back down", () => {
			const sprites = [sprite({ vy: -100 })];
			let field = sprites;
			for (let i = 0; i < 10; i++) field = advanceSprites(field, 1 / 60, 1000);
			expect(field[0]!.vy).toBeGreaterThan(-100);
		});

		it("Should cull sprites that fall below the viewport, so fast typing cannot leak them", () => {
			const below = sprite({ y: 1000 + SPRITE_SIZE + 1 });
			expect(advanceSprites([below], 1 / 60, 1000)).toHaveLength(0);
		});

		it("Should keep a sprite that is above the viewport, because it is still on its way up", () => {
			const above = sprite({ y: -500, vy: -100 });
			expect(advanceSprites([above], 1 / 60, 1000)).toHaveLength(1);
		});

		it("Should cull a fully faded sprite even if it never left the screen", () => {
			const stuck = sprite({ age: FADE_SECONDS + 0.1 });
			expect(advanceSprites([stuck], 1 / 60, 1000)).toHaveLength(0);
		});
	});

	describe("getSpriteOpacity", () => {
		it("Should fade from fully opaque to fully transparent over the sprite's life", () => {
			const s: Sprite = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, age: 0, src: sources[0]! };
			expect(getSpriteOpacity(s)).toBe(1);
			s.age = FADE_SECONDS / 2;
			expect(getSpriteOpacity(s)).toBeCloseTo(0.5);
			s.age = FADE_SECONDS * 2;
			expect(getSpriteOpacity(s)).toBe(0);
		});
	});
});
