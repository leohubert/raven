import { describe, expect, it } from "bun:test";

import { newPool, PushTheme } from "./index";
import { helloFor, themeStoreFixture } from "./fixture.test";
import type { Theme, ThemeAsset } from "../../src/themes";
import type { PushThemeChunk, ServerToClient } from "../../src/gen/raven/control/v1/control_pb";

const asset = (rel: string, kind: ThemeAsset["kind"]): ThemeAsset => ({
	rel,
	url: `pushed:///${rel}`,
	kind,
});

const FLOCS: Theme = {
	name: "flocs",
	intro: [asset("flocs/intro.m4a", "sound")],
	groups: [
		{
			name: "a",
			sounds: [asset("flocs/global/a/a.m4a", "sound")],
			images: [asset("flocs/global/a/a.png", "image")],
		},
	],
	keys: {},
};

function connectedPool() {
	const sent: ServerToClient[] = [];
	const pool = newPool({ now: () => new Date(0) });
	pool.onConnect("c1", (msg) => sent.push(msg));
	pool.onClientMessage("c1", helloFor("c1"));
	return { pool, chunks: () => sent.map((m) => m.msg.value as PushThemeChunk) };
}

describe("server business", () => {
	describe("PushTheme", () => {
		it("Should lead with the theme's manifest, since a client cannot derive the shape of a theme it has never had on disk", async () => {
			const { pool, chunks } = connectedPool();

			const result = await PushTheme(
				{ pool, themes: themeStoreFixture([FLOCS]) },
				{ clientId: "c1", theme: "flocs" },
			);

			expect(result.accepted).toBe(true);
			const sent = chunks();
			expect(JSON.parse(sent[0]!.manifest)).toEqual(FLOCS);
			expect(sent.map((c) => c.rel)).toEqual([
				"",
				"flocs/global/a/a.m4a",
				"flocs/global/a/a.png",
				"flocs/intro.m4a",
			]);
			// Every file's own bytes, and a mime the webview can hand to Audio/Image.
			expect(new TextDecoder().decode(sent[1]!.data)).toBe("flocs/global/a/a.m4a");
			expect(sent[1]!.mime).toBe("audio/mp4");
			expect(sent[2]!.mime).toBe("image/png");
		});

		it("Should count the manifest in `total` and share one command id, so the client knows when the theme is whole and acks it once", async () => {
			// A per-chunk ack would make the dashboard's pending state meaningless, and a
			// total that excluded the manifest would leave the client one chunk short forever.
			const { pool, chunks } = connectedPool();

			await PushTheme({ pool, themes: themeStoreFixture([FLOCS]) }, { clientId: "c1", theme: "flocs" });

			const sent = chunks();
			expect(sent).toHaveLength(4);
			expect(sent.every((c) => c.total === 4)).toBe(true);
			expect(new Set(sent.map((c) => c.commandId)).size).toBe(1);
			expect(sent.map((c) => c.seq)).toEqual([0, 1, 2, 3]);
		});

		it("Should refuse a theme the server does not have without sending anything, so the operator is told instead of waiting on an ack that never comes", async () => {
			const { pool, chunks } = connectedPool();

			const result = await PushTheme(
				{ pool, themes: themeStoreFixture([FLOCS]) },
				{ clientId: "c1", theme: "ghost" },
			);

			expect(result.accepted).toBe(false);
			expect(result.error).toContain("ghost");
			expect(chunks()).toHaveLength(0);
		});
	});
});
