import { describe, expect, it } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ASSET_BASE_URL, RAVEN_TREE, themeStoreFactory } from "./factory.test";
import type { Theme } from "./types";

describe("themes", () => {
	describe("ListThemes", () => {
		it("Should list every theme directory, so dropping a folder in is enough to add one", async () => {
			const { store } = await themeStoreFactory(RAVEN_TREE);
			expect(await store.ListThemes()).toEqual(["raven", "toad"]);
		});

		it("Should return empty rather than throw when the themes root has no themes", async () => {
			const { store } = await themeStoreFactory({});
			expect(await store.ListThemes()).toEqual([]);
		});
	});

	describe("GetTheme", () => {
		it("Should keep each group's sounds and images together, which is what correlates a voice with its photos", async () => {
			const { store } = await themeStoreFactory(RAVEN_TREE);
			const theme = await store.GetTheme("raven");

			const gael = theme.groups.find((g) => g.name === "gael");
			expect(gael?.sounds.map((s) => s.rel)).toEqual(["raven/global/gael/gael.m4a"]);
			expect(gael?.images.map((i) => i.rel)).toEqual([
				"raven/global/gael/gael-1.png",
				"raven/global/gael/gael-2.png",
			]);
			// manu's assets must NOT leak into gael's group, or the joke breaks
			expect(gael?.images.some((i) => i.rel.includes("manu"))).toBe(false);
		});

		it("Should put loose files under global/ in the unnamed group, not in a subgroup", async () => {
			const { store } = await themeStoreFactory(RAVEN_TREE);
			const theme = await store.GetTheme("raven");

			const loose = theme.groups.find((g) => g.name === "");
			expect(loose?.images.map((i) => i.rel)).toEqual(["raven/global/loose.png"]);
			expect(loose?.sounds.map((s) => s.rel)).toEqual(["raven/global/loose.m4a"]);
		});

		it("Should expose per-key directories as key overrides, so pressing 'a' can have its own clip", async () => {
			const { store } = await themeStoreFactory(RAVEN_TREE);
			const theme = await store.GetTheme("raven");

			expect(Object.keys(theme.keys)).toEqual(["a"]);
			expect(theme.keys["a"]?.sounds.map((s) => s.rel)).toEqual(["raven/a/manu-a.m4a"]);
			// 'global' is the theme-wide pool, never a key binding
			expect(theme.keys["global"]).toBeUndefined();
		});

		it("Should detect intro sounds at the theme root", async () => {
			const { store } = await themeStoreFactory(RAVEN_TREE);
			const theme = await store.GetTheme("raven");
			expect(theme.intro.map((a) => a.rel)).toEqual(["raven/intro.m4a"]);
		});

		it("Should recurse to any depth, because the original scanner silently stopped after one level", async () => {
			const { store } = await themeStoreFactory({
				deep: [],
				"deep/global/a/b/c": ["buried.png", "buried.m4a"],
			});
			const theme = await store.GetTheme("deep");
			const group = theme.groups.find((g) => g.name === "a");
			expect(group?.images.map((i) => i.rel)).toEqual(["deep/global/a/b/c/buried.png"]);
		});

		it("Should build views:// URLs, the only scheme the webview can load assets from", async () => {
			const { store } = await themeStoreFactory(RAVEN_TREE);
			const theme = await store.GetTheme("raven");
			const gael = theme.groups.find((g) => g.name === "gael");
			expect(gael?.images[0]?.url).toBe(`${ASSET_BASE_URL}/raven/global/gael/gael-1.png`);
		});

		it("Should ignore files whose extension is neither a known sound nor image", async () => {
			const { store } = await themeStoreFactory({
				junk: [],
				"junk/global": ["a.png", "notes.txt", "thumbs.db", "clip.m4a"],
			});
			const theme = await store.GetTheme("junk");
			const loose = theme.groups.find((g) => g.name === "");
			expect(loose?.images).toHaveLength(1);
			expect(loose?.sounds).toHaveLength(1);
		});

		it("Should accept png, webp and gif, so optimised and animated assets both work", async () => {
			const { store } = await themeStoreFactory({
				mixed: [],
				"mixed/global": ["a.png", "b.webp", "c.gif"],
			});
			const theme = await store.GetTheme("mixed");
			expect(theme.groups.find((g) => g.name === "")?.images).toHaveLength(3);
		});

		it("Should throw for a theme that does not exist rather than return an empty theme", async () => {
			const { store } = await themeStoreFactory(RAVEN_TREE);
			expect(store.GetTheme("nope")).rejects.toThrow("theme not found: nope");
		});
	});

	describe("GetSettings", () => {
		it("Should default to no theme when nothing has been saved yet", async () => {
			const { store } = await themeStoreFactory(RAVEN_TREE);
			expect(await store.GetSettings()).toEqual({ theme: null });
		});

		it("Should read back a theme that was previously saved", async () => {
			const { store } = await themeStoreFactory(RAVEN_TREE);
			await store.UpdateSettings({ theme: "raven" });
			expect((await store.GetSettings()).theme).toBe("raven");
		});
	});

	describe("UpdateSettings", () => {
		it("Should persist the selected theme, which the original never did", async () => {
			const { store } = await themeStoreFactory(RAVEN_TREE);
			await store.UpdateSettings({ theme: "toad" });
			expect((await store.GetSettings()).theme).toBe("toad");
		});

		it("Should merge a patch rather than replace the whole file", async () => {
			const { store } = await themeStoreFactory(RAVEN_TREE);
			await store.UpdateSettings({ theme: "raven" });
			expect(await store.UpdateSettings({})).toEqual({ theme: "raven" });
		});
	});
});

describe("themes settings file handling", () => {
	it("Should recover when the settings file is invalid JSON", async () => {
		const settingsPath = join(tmpdir(), `raven-corrupt-${Math.random()}.json`);
		const { store } = await themeStoreFactory(RAVEN_TREE, { settingsPath });
		await writeFile(settingsPath, "{ not json");
		expect(await store.GetSettings()).toEqual({ theme: null });
	});

	it("Should treat a non-string theme value as unset rather than trusting the file", async () => {
		const settingsPath = join(tmpdir(), `raven-badtype-${Math.random()}.json`);
		const { store } = await themeStoreFactory(RAVEN_TREE, { settingsPath });
		await writeFile(settingsPath, JSON.stringify({ theme: 42 }));
		expect(await store.GetSettings()).toEqual({ theme: null });
	});

	it("Should write readable JSON so the file can be inspected and edited by hand", async () => {
		const settingsPath = join(tmpdir(), `raven-readable-${Math.random()}.json`);
		const { store } = await themeStoreFactory(RAVEN_TREE, { settingsPath });
		await store.UpdateSettings({ theme: "toad" });
		expect(await readFile(settingsPath, "utf8")).toBe('{\n  "theme": "toad"\n}\n');
	});
});

describe("themes image format deduplication", () => {
	it("Should keep one entry when the same image exists as both png and webp", async () => {
		// The upstream optimiser wrote .webp beside every .png and removed nothing, so a
		// naive scan doubles the pool and biases the random pick.
		const { store } = await themeStoreFactory({
			dup: [],
			"dup/global/seb": ["french-seb.png", "french-seb.webp", "seb.m4a"],
		});
		const theme = await store.GetTheme("dup");
		const group = theme.groups.find((g) => g.name === "seb");

		expect(group?.images.map((i) => i.rel)).toEqual(["dup/global/seb/french-seb.webp"]);
		expect(group?.sounds).toHaveLength(1);
	});

	it("Should keep genuinely different images that merely share a directory", async () => {
		const { store } = await themeStoreFactory({
			many: [],
			"many/global/seb": ["one.webp", "two.webp", "three.png"],
		});
		const theme = await store.GetTheme("many");
		expect(theme.groups.find((g) => g.name === "seb")?.images).toHaveLength(3);
	});

	it("Should prefer webp over png, which is 20x smaller for these assets", async () => {
		const { store } = await themeStoreFactory({
			pick: [],
			"pick/global": ["a.png", "a.webp"],
		});
		const theme = await store.GetTheme("pick");
		expect(theme.groups.find((g) => g.name === "")?.images[0]?.rel).toBe("pick/global/a.webp");
	});
});

describe("themes pushed at runtime", () => {
	it("Should make a pushed theme loadable by name, since the operator activates it by name right after pushing", async () => {
		const { store } = await themeStoreFactory(RAVEN_TREE);
		const pushed: Theme = { name: "flocs", intro: [], groups: [], keys: {} };

		store.UpsertPushedTheme(pushed);

		expect(await store.ListThemes()).toEqual(["flocs", "raven", "toad"]);
		expect(await store.GetTheme("flocs")).toEqual(pushed);
	});

	it("Should let a pushed theme win over the disk theme of the same name, which is what re-pushing an edited theme means", async () => {
		const { store } = await themeStoreFactory(RAVEN_TREE);
		const pushed: Theme = { name: "raven", intro: [], groups: [], keys: {} };

		store.UpsertPushedTheme(pushed);

		expect(await store.GetTheme("raven")).toEqual(pushed);
		expect(await store.ListThemes()).toEqual(["raven", "toad"]);
	});
});

describe("themes GetAsset", () => {
	it("Should read a theme file's bytes, which is how the server ships a theme to a client that has never had it", async () => {
		const { store } = await themeStoreFactory(RAVEN_TREE);

		const bytes = await store.GetAsset("raven/global/gael/gael.m4a");

		expect(new TextDecoder().decode(bytes)).toBe("x");
	});
});
