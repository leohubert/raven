import { describe, expect, it } from "bun:test";

import { businessFixture, themeStoreFixture } from "./fixture.test";
import { assetMock, groupMock, themeMock } from "./mock.test";

const press = { position: { x: 100, y: 200 }, scaleFactor: 2 };

describe("business", () => {
	describe("playAsset", () => {
		it("Should play the named asset and take its images from the same group, so a colleague's voice still arrives with their own face", async () => {
			const { business, ctx } = businessFixture();

			const burst = await business.playAsset(ctx, {
				theme: "raven",
				rel: "raven/global/gael/gael.m4a",
				...press,
			});

			expect(burst).not.toBeNull();
			expect(burst!.sound!.rel).toBe("raven/global/gael/gael.m4a");
			for (const image of burst!.images) expect(image.rel).toContain("/gael/");
		});

		it("Should find the asset in a per-key override, since PlaySound must reach those too", async () => {
			const { business, ctx } = businessFixture();

			const burst = await business.playAsset(ctx, {
				theme: "raven",
				rel: "raven/a/manu-a.m4a",
				...press,
			});

			expect(burst!.sound!.rel).toBe("raven/a/manu-a.m4a");
			expect(burst!.images.map((i) => i.rel)).toEqual(["raven/a/manu-a.png"]);
		});

		it("Should pass the given position and scaleFactor straight through", async () => {
			const { business, ctx } = businessFixture();

			const burst = await business.playAsset(ctx, {
				theme: "raven",
				rel: "raven/global/gael/gael.m4a",
				position: { x: 42, y: 99 },
				scaleFactor: 3,
			});

			expect(burst!.position).toEqual({ x: 42, y: 99 });
			expect(burst!.scaleFactor).toBe(3);
		});

		it("Should never send more than 3 images even when the group holds more", async () => {
			const { business, ctx } = businessFixture({ random: () => 0.4 });
			// groupMock's default "gael" group has 4 images.
			const burst = await business.playAsset(ctx, {
				theme: "raven",
				rel: "raven/global/gael/gael.m4a",
				...press,
			});

			expect(burst!.images.length).toBeLessThanOrEqual(3);
		});

		it("Should return null when the rel does not match any asset in the theme", async () => {
			const { business, ctx } = businessFixture();

			const burst = await business.playAsset(ctx, {
				theme: "raven",
				rel: "raven/global/nobody/nobody.m4a",
				...press,
			});

			expect(burst).toBeNull();
		});

		it("Should return null when the theme itself does not exist, rather than throwing", async () => {
			// A thrown error here would surface through onCommand as a dropped connection
			// instead of an honest failed Ack - see src/control/onCommand.ts's "play" arm.
			const { business, ctx } = businessFixture();

			const burst = await business.playAsset(ctx, {
				theme: "does-not-exist",
				rel: "raven/global/gael/gael.m4a",
				...press,
			});

			expect(burst).toBeNull();
		});

		it("Should leave the active theme and anti-repeat histories untouched (Ruling E): a one-shot must have no side effects on an ACTIVE client's session", async () => {
			// Three single-sound groups and random()=0: without the group-history filter in
			// pickGroup, every draw would land on "gael" again.
			const raven = themeMock({
				groups: ["gael", "manu", "seb"].map((name) =>
					groupMock({
						name,
						sounds: [assetMock(`raven/global/${name}/${name}.m4a`, "sound")],
						images: [],
					}),
				),
				keys: {},
			});
			const other = themeMock({
				name: "other",
				groups: [
					groupMock({
						name: "x",
						sounds: [assetMock("other/global/x/x.m4a", "sound")],
						images: [],
					}),
				],
				keys: {},
			});
			const { business, ctx } = businessFixture({
				themes: themeStoreFixture([raven, other]).store,
				random: () => 0,
			});
			await business.loadTheme(ctx, { name: "raven" });

			const first = business.onKeyPressed(ctx, { char: "z", ...press })!.sound!.rel;
			expect(first).toBe("raven/global/gael/gael.m4a");

			// A one-shot against a completely different theme - if this called
			// business.loadTheme under the hood, the active theme would flip to "other" and
			// the anti-repeat histories would be wiped clean.
			const burst = await business.playAsset(ctx, {
				theme: "other",
				rel: "other/global/x/x.m4a",
				...press,
			});
			expect(burst?.sound?.rel).toBe("other/global/x/x.m4a");

			expect(business.getCurrentTheme()?.name).toBe("raven");

			// If playAsset had reset recentGroups, this would immediately repeat "gael"
			// instead of moving on to a different person.
			const second = business.onKeyPressed(ctx, { char: "z", ...press })!.sound!.rel;
			expect(second).not.toBe("raven/global/gael/gael.m4a");
		});
	});
});
