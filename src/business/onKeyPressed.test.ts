import { describe, expect, it } from "bun:test";

import { businessFixture, themeStoreFixture } from "./fixture.test";
import { assetMock, groupMock, themeMock } from "./mock.test";
import { MAX_SPRITES, MIN_SPRITES } from "./types";
import { NoThemeLoadedError } from "./error";

const press = { char: "z", position: { x: 100, y: 200 }, scaleFactor: 2 };

describe("business", () => {
	describe("onKeyPressed", () => {
		it("Should take the sound and the images from the SAME group, which is what makes a voice arrive with its own face", async () => {
			const { business, ctx } = businessFixture();
			await business.loadTheme(ctx, { name: "raven" });

			const burst = business.onKeyPressed(ctx, press);

			expect(burst).not.toBeNull();
			expect(burst!.sound!.rel).toContain("/gael/");
			for (const image of burst!.images) expect(image.rel).toContain("/gael/");
		});

		it("Should prefer a per-key directory over the global pool, so pressing 'a' always plays its own clip", async () => {
			const { business, ctx } = businessFixture();
			await business.loadTheme(ctx, { name: "raven" });

			const burst = business.onKeyPressed(ctx, { ...press, char: "a" });

			expect(burst!.sound!.rel).toBe("raven/a/manu-a.m4a");
			expect(burst!.images.map((i) => i.rel)).toEqual(["raven/a/manu-a.png"]);
		});

		it("Should not replay the clip it just played, so a burst of typing does not sound stuck", async () => {
			// Two sounds in one group and a random() that always picks index 0: without the
			// history filter both presses would return the same clip.
			const theme = themeMock({
				groups: [
					groupMock({
						sounds: [
							assetMock("raven/global/gael/one.m4a", "sound"),
							assetMock("raven/global/gael/two.m4a", "sound"),
						],
					}),
				],
				keys: {},
			});
			const { business, ctx } = businessFixture({
				themes: themeStoreFixture([theme]).store,
			});
			await business.loadTheme(ctx, { name: "raven" });

			const first = business.onKeyPressed(ctx, press);
			const second = business.onKeyPressed(ctx, press);

			expect(first!.sound!.rel).not.toBe(second!.sound!.rel);
		});

		it("Should not draw the same person twice in a row, because one clip per folder means the group IS the repeat", async () => {
			// Every group in the shipped theme holds a single sound, so pickSound's history
			// can never offer an alternative - only pickGroup can. random() returns 0, so
			// without the group history all three presses would land on "gael".
			const theme = themeMock({
				groups: ["gael", "manu", "seb"].map((name) =>
					groupMock({
						name,
						sounds: [assetMock(`raven/global/${name}/${name}.m4a`, "sound")],
						images: [assetMock(`raven/global/${name}/${name}.webp`)],
					}),
				),
				keys: {},
			});
			const { business, ctx } = businessFixture({
				themes: themeStoreFixture([theme]).store,
			});
			await business.loadTheme(ctx, { name: "raven" });

			const names = [0, 1, 2].map(
				() => business.onKeyPressed(ctx, press)!.sound!.rel.split("/")[2],
			);

			expect(new Set(names).size).toBe(3);
		});

		it("Should keep working once every clip has been played recently, rather than going silent", async () => {
			const theme = themeMock({
				groups: [groupMock({ sounds: [assetMock("raven/global/gael/only.m4a", "sound")] })],
				keys: {},
			});
			const { business, ctx } = businessFixture({
				themes: themeStoreFixture([theme]).store,
			});
			await business.loadTheme(ctx, { name: "raven" });

			for (let i = 0; i < 5; i++) {
				expect(business.onKeyPressed(ctx, press)!.sound!.rel).toBe(
					"raven/global/gael/only.m4a",
				);
			}
		});

		it("Should return a burst with no sound for an image-only group instead of recursing forever", async () => {
			// The original pickRandomSound reset its history and called itself with no base
			// case, so an image-only folder overflowed the stack.
			const theme = themeMock({
				groups: [groupMock({ sounds: [], images: [assetMock("raven/global/x/x.png")] })],
				keys: {},
			});
			const { business, ctx } = businessFixture({
				themes: themeStoreFixture([theme]).store,
			});
			await business.loadTheme(ctx, { name: "raven" });

			const burst = business.onKeyPressed(ctx, press);

			expect(burst!.sound).toBeNull();
			expect(burst!.images).toHaveLength(1);
		});

		it("Should return null when the group has nothing at all, so the transport can skip the round trip", async () => {
			const theme = themeMock({
				groups: [groupMock({ sounds: [], images: [] })],
				keys: {},
			});
			const { business, ctx } = businessFixture({
				themes: themeStoreFixture([theme]).store,
			});
			await business.loadTheme(ctx, { name: "raven" });

			expect(business.onKeyPressed(ctx, press)).toBeNull();
		});

		it("Should spray between 5 and 15 sprites, matching the original's feel", async () => {
			for (const r of [0, 0.5, 0.999]) {
				const { business, ctx } = businessFixture({ random: () => r });
				await business.loadTheme(ctx, { name: "raven" });
				const burst = business.onKeyPressed(ctx, press)!;
				expect(burst.count).toBeGreaterThanOrEqual(MIN_SPRITES);
				expect(burst.count).toBeLessThanOrEqual(MAX_SPRITES);
			}
		});

		it("Should pass the cursor position and scaleFactor straight through, so the renderer never guesses DPR", async () => {
			const { business, ctx } = businessFixture();
			await business.loadTheme(ctx, { name: "raven" });

			const burst = business.onKeyPressed(ctx, {
				char: "z",
				position: { x: 42, y: 99 },
				scaleFactor: 3,
			})!;

			expect(burst.position).toEqual({ x: 42, y: 99 });
			expect(burst.scaleFactor).toBe(3);
		});

		it("Should never send more than 3 images, so a keystroke stays cheap", async () => {
			const { business, ctx } = businessFixture({ random: () => 0.4 });
			await business.loadTheme(ctx, { name: "raven" });
			// groupMock has 4 images
			expect(business.onKeyPressed(ctx, press)!.images.length).toBeLessThanOrEqual(3);
		});

		it("Should refuse to work before a theme is loaded rather than silently doing nothing", () => {
			const { business, ctx } = businessFixture();
			expect(() => business.onKeyPressed(ctx, press)).toThrow(NoThemeLoadedError);
		});
	});
});
