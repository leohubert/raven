import { create } from "@bufbuild/protobuf";
import { describe, expect, it } from "bun:test";

import { PushThemeChunkSchema } from "../gen/raven/control/v1/control_pb";
import type { Theme } from "../themes";
import { newThemeReceiver, sanitizeRel } from "./receiveTheme";

const FLOCS: Theme = {
	name: "flocs",
	intro: [],
	groups: [
		{
			name: "a",
			sounds: [{ rel: "flocs/global/a/a.m4a", url: "pushed:///flocs/global/a/a.m4a", kind: "sound" }],
			images: [],
		},
	],
	keys: {},
};

function manifestChunk(total: number, commandId = "cmd") {
	return create(PushThemeChunkSchema, {
		commandId,
		theme: FLOCS.name,
		seq: 0,
		total,
		manifest: JSON.stringify(FLOCS),
	});
}

function assetChunk(rel: string, seq: number, total: number, commandId = "cmd") {
	return create(PushThemeChunkSchema, {
		commandId,
		theme: FLOCS.name,
		rel,
		mime: "audio/mp4",
		seq,
		total,
		data: new TextEncoder().encode("clip"),
	});
}

describe("control", () => {
	describe("sanitizeRel", () => {
		it("Should refuse a path that escapes its theme", () => {
			// Nothing is written to disk today, but disk persistence is the obvious next step
			// and a traversal bug introduced now would ship silently with it.
			expect(sanitizeRel("../../../.ssh/id_rsa")).toBeNull();
			expect(sanitizeRel("flocs/../../etc/passwd")).toBeNull();
			expect(sanitizeRel("/etc/passwd")).toBeNull();
			expect(sanitizeRel("flocs/a/a.m4a")).toBe("flocs/a/a.m4a");
		});
	});

	describe("receiveTheme", () => {
		it("Should hand over nothing until the last chunk arrives, since half a theme plays nothing but silence", () => {
			const receiver = newThemeReceiver();

			expect(receiver.onChunk(manifestChunk(2)).case).toBe("pending");

			const outcome = receiver.onChunk(assetChunk("flocs/global/a/a.m4a", 1, 2));

			expect(outcome).toEqual({
				case: "ready",
				value: {
					theme: FLOCS,
					assets: [
						{
							rel: "flocs/global/a/a.m4a",
							mime: "audio/mp4",
							base64: Buffer.from("clip").toString("base64"),
						},
					],
				},
			});
		});

		it("Should abandon the whole push when one path escapes, rather than adopting a theme built around the rest", () => {
			const receiver = newThemeReceiver();
			receiver.onChunk(manifestChunk(3));

			const outcome = receiver.onChunk(assetChunk("../../../.ssh/id_rsa", 1, 3));

			expect(outcome.case).toBe("rejected");
			// Refused once, then silent: the chunks already on the wire must neither complete
			// the push as if nothing had happened nor each raise their own failed ack.
			expect(receiver.onChunk(assetChunk("flocs/global/a/a.m4a", 2, 3)).case).toBe("discarded");
		});

		it("Should keep concurrent pushes apart, so one client's two pushes never assemble into one theme", () => {
			const receiver = newThemeReceiver();

			expect(receiver.onChunk(manifestChunk(2, "first")).case).toBe("pending");
			expect(receiver.onChunk(manifestChunk(2, "second")).case).toBe("pending");
			expect(receiver.onChunk(assetChunk("flocs/global/a/a.m4a", 1, 2, "first")).case).toBe("ready");
			expect(receiver.onChunk(assetChunk("flocs/global/a/a.m4a", 1, 2, "second")).case).toBe("ready");
		});

		it("Should reject a push whose manifest never arrived, since the theme's shape cannot be guessed from its files", () => {
			const receiver = newThemeReceiver();

			const outcome = receiver.onChunk(assetChunk("flocs/global/a/a.m4a", 0, 1));

			expect(outcome.case).toBe("rejected");
		});
	});
});
