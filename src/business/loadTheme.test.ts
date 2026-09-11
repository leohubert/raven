import { describe, expect, it } from "bun:test";

import { businessFixture, themeStoreFixture } from "./fixture.test";
import { themeMock } from "./mock.test";
import { NoThemesAvailableError } from "./error";

describe("business", () => {
	describe("loadTheme", () => {
		it("Should load the named theme", async () => {
			const { business, ctx } = businessFixture();
			expect((await business.loadTheme(ctx, { name: "raven" })).name).toBe("raven");
			expect(business.getCurrentTheme()?.name).toBe("raven");
		});

		it("Should restore the theme saved last session, which the original never did", async () => {
			const fixture = themeStoreFixture([themeMock(), themeMock({ name: "toad" })]);
			await fixture.store.UpdateSettings({ theme: "toad" });
			const { business, ctx } = businessFixture({ themes: fixture.store });

			expect((await business.loadTheme(ctx)).name).toBe("toad");
		});

		it("Should persist the selection so the next start restores it", async () => {
			const fixture = themeStoreFixture([themeMock(), themeMock({ name: "toad" })]);
			const { business, ctx } = businessFixture({ themes: fixture.store });

			await business.loadTheme(ctx, { name: "toad" });

			expect(fixture.settings.theme).toBe("toad");
		});

		it("Should fall back to a random theme when the saved one no longer exists on disk", async () => {
			const fixture = themeStoreFixture([themeMock()]);
			await fixture.store.UpdateSettings({ theme: "deleted-theme" });
			const { business, ctx } = businessFixture({ themes: fixture.store });

			expect((await business.loadTheme(ctx)).name).toBe("raven");
		});

		it("Should fail loudly when there are no themes at all, instead of running with nothing to show", async () => {
			const { business, ctx } = businessFixture({
				themes: themeStoreFixture([]).store,
			});
			expect(business.loadTheme(ctx)).rejects.toThrow(NoThemesAvailableError);
		});

		it("Should clear the anti-repeat history, so a new theme does not inherit the old one's picks", async () => {
			const { business, ctx } = businessFixture();
			await business.loadTheme(ctx, { name: "raven" });
			business.onKeyPressed(ctx, { char: "z", position: { x: 0, y: 0 }, scaleFactor: 2 });

			await business.loadTheme(ctx, { name: "raven" });
			const burst = business.onKeyPressed(ctx, {
				char: "z",
				position: { x: 0, y: 0 },
				scaleFactor: 2,
			});
			// With random()=0 and a cleared history this is the first sound again.
			expect(burst!.sound!.rel).toBe("raven/global/gael/gael.m4a");
		});
	});

	describe("cycleTheme", () => {
		it("Should walk through every theme rather than toggling between two", async () => {
			const themes = [themeMock({ name: "a" }), themeMock({ name: "b" }), themeMock({ name: "c" })];
			const { business, ctx } = businessFixture({ themes: themeStoreFixture(themes).store });
			await business.loadTheme(ctx, { name: "a" });

			expect((await business.cycleTheme(ctx)).name).toBe("b");
			expect((await business.cycleTheme(ctx)).name).toBe("c");
		});

		it("Should wrap around from the last theme back to the first", async () => {
			const themes = [themeMock({ name: "a" }), themeMock({ name: "b" })];
			const { business, ctx } = businessFixture({ themes: themeStoreFixture(themes).store });
			await business.loadTheme(ctx, { name: "b" });

			expect((await business.cycleTheme(ctx)).name).toBe("a");
		});
	});

	describe("isHealthy", () => {
		it("Should report unhealthy until a theme is loaded", async () => {
			const { business, ctx } = businessFixture();
			expect(business.isHealthy()).toBe(false);
			await business.loadTheme(ctx, { name: "raven" });
			expect(business.isHealthy()).toBe(true);
		});
	});
});
