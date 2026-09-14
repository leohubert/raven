import { describe, expect, it } from "bun:test";

import { newPushedAssets } from "./pushed";

function fakeUrls() {
	const created: Blob[] = [];
	const revoked: string[] = [];
	return {
		created,
		revoked,
		createObjectURL: (blob: Blob) => {
			created.push(blob);
			return `blob:${created.length}`;
		},
		revokeObjectURL: (url: string) => {
			revoked.push(url);
		},
	};
}

const CLIP = { rel: "flocs/a/a.m4a", mime: "audio/mp4", base64: Buffer.from("clip").toString("base64") };

describe("overlay view", () => {
	describe("pushed assets", () => {
		it("Should resolve a pushed asset to a blob URL, since views:// can only serve files baked into the bundle", async () => {
			const urls = fakeUrls();
			const pushed = newPushedAssets(urls);

			pushed.adopt([CLIP]);

			expect(pushed.resolve({ rel: CLIP.rel, url: "pushed:///flocs/a/a.m4a" })).toBe("blob:1");
			// The mime has to survive the trip: an Audio element will not play a typeless Blob.
			expect(urls.created[0]?.type).toBe("audio/mp4");
			expect(await urls.created[0]?.text()).toBe("clip");
		});

		it("Should leave a bundled asset's own URL alone, so a pushed theme and a bundled one render through the same path", () => {
			const pushed = newPushedAssets(fakeUrls());

			pushed.adopt([CLIP]);

			expect(pushed.resolve({ rel: "raven/a/a.m4a", url: "views://overlay/themes/raven/a/a.m4a" })).toBe(
				"views://overlay/themes/raven/a/a.m4a",
			);
		});

		it("Should revoke the previous push's URLs, so re-pushing a theme all afternoon does not leak every version of it", () => {
			const urls = fakeUrls();
			const pushed = newPushedAssets(urls);

			pushed.adopt([CLIP]);
			pushed.adopt([CLIP]);

			expect(urls.revoked).toEqual(["blob:1"]);
			expect(pushed.resolve({ rel: CLIP.rel, url: "pushed:///flocs/a/a.m4a" })).toBe("blob:2");
		});
	});
});
