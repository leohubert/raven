import { create } from "@bufbuild/protobuf";
import { makeIterableAbortable } from "@connectrpc/connect/protocol";
import { describe, expect, it, spyOn } from "bun:test";

import type { Burst } from "../business";
import { businessFixture, themeStoreFixture } from "../business/fixture.test";
import { themeMock } from "../business/mock.test";
import type { Theme } from "../themes";
import {
	ActivateSchema,
	BurstKeySchema,
	ClientState,
	DeactivateSchema,
	PingSchema,
	PlaySoundSchema,
	PushThemeChunkSchema,
	ServerToClientSchema,
	type Ack,
	type Pong,
	type ServerToClient,
	type StateChanged,
} from "../gen/raven/control/v1/control_pb";
import { flush, newInputSpy, newOverlaySpy, newTestControl } from "./fixture.test";
import { newOnCommand, type Options } from "./onCommand";

/** Default opts for exercising `onCommand` directly, without a whole `newControl`. */
function onCommandFixture(overrides: Partial<Options> = {}) {
	return {
		business: businessFixture().business,
		overlay: newOverlaySpy(),
		input: newInputSpy(),
		themes: themeStoreFixture().store,
		...overrides,
	} satisfies Options;
}

const PUSHED_THEME: Theme = {
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

function pushChunk(fields: {
	commandId?: string;
	seq: number;
	total: number;
	manifest?: string;
	rel?: string;
	mime?: string;
	data?: Uint8Array;
}): ServerToClient {
	return create(ServerToClientSchema, {
		msg: {
			case: "push",
			value: create(PushThemeChunkSchema, { commandId: "p1", theme: PUSHED_THEME.name, ...fields }),
		},
	});
}

function playSound(commandId: string, theme: string, rel: string): ServerToClient {
	return create(ServerToClientSchema, {
		msg: { case: "play", value: create(PlaySoundSchema, { commandId, theme, rel }) },
	});
}

function burstKey(commandId: string, character: string): ServerToClient {
	return create(ServerToClientSchema, {
		msg: { case: "burst", value: create(BurstKeySchema, { commandId, character }) },
	});
}

function activate(commandId: string, theme: string): ServerToClient {
	return create(ServerToClientSchema, {
		msg: { case: "activate", value: create(ActivateSchema, { commandId, theme }) },
	});
}

function deactivate(commandId: string): ServerToClient {
	return create(ServerToClientSchema, {
		msg: { case: "deactivate", value: create(DeactivateSchema, { commandId }) },
	});
}

describe("control", () => {
	describe("onCommand", () => {
		it("Should not register hotkeys while passive", async () => {
			// A Carbon hotkey CONSUMES the keystroke system-wide. A client that registers
			// before being activated silently steals the machine owner's keyboard - the
			// single worst failure this system can have.
			//
			// newTestControl deliberately dials a port nothing listens on, so Start() always
			// logs a connection failure - expected noise from a real code path, silenced here
			// so the test's own output stays about what it's actually asserting.
			const errorSpy = spyOn(console, "error").mockImplementation(() => {});
			const logSpy = spyOn(console, "log").mockImplementation(() => {});
			const input = newInputSpy();
			const control = newTestControl({ input });

			control.Start();
			await flush();

			expect(input.startCalls).toBe(0);
			// Stop() cancels the pending reconnect timer, so it never fires (and logs) later,
			// into whichever test happens to be running by then. It also aborts the in-flight
			// connect attempt, which rejects on a later microtask - flush() lets that land
			// while the spies above are still in place, instead of after they're restored.
			control.Stop();
			await flush();
			errorSpy.mockRestore();
			logSpy.mockRestore();
		});

		it("Should answer Ping with Pong, echoing the nonce", async () => {
			// The server prunes any client that never pongs, every 45s (task 3's PruneStale).
			// A client that ignores Ping silently vanishes from the roster while still
			// believing it is connected - the roster flickers and remote commands fail for
			// reasons nobody could diagnose.
			const { onCommand, outbound } = newOnCommand(onCommandFixture());
			const iter = outbound[Symbol.asyncIterator]();

			await onCommand(
				create(ServerToClientSchema, { msg: { case: "ping", value: create(PingSchema, { nonce: 42n }) } }),
			);

			const { value } = await iter.next();
			expect(value?.msg.case).toBe("pong");
			expect((value?.msg.value as Pong).nonce).toBe(42n);
		});

		describe("push", () => {
			it("Should register a pushed theme under its name and hand its files to the overlay, the only route a pushed asset has to the screen", async () => {
				// Registering it is what makes the next Activate(flocs) work: the theme is on no
				// disk this client can read, so nothing else could ever resolve that name.
				const themes = themeStoreFixture([]);
				const overlay = newOverlaySpy();
				const { onCommand, outbound } = newOnCommand(
					onCommandFixture({ themes: themes.store, overlay }),
				);
				const iter = outbound[Symbol.asyncIterator]();

				await onCommand(pushChunk({ seq: 0, total: 2, manifest: JSON.stringify(PUSHED_THEME) }));
				await onCommand(
					pushChunk({
						seq: 1,
						total: 2,
						rel: "flocs/global/a/a.m4a",
						mime: "audio/mp4",
						data: new TextEncoder().encode("clip"),
					}),
				);

				expect(themes.calls.pushed).toEqual([PUSHED_THEME]);
				expect(overlay.calls.pushedAssets).toEqual([
					{
						theme: "flocs",
						assets: [
							{
								rel: "flocs/global/a/a.m4a",
								mime: "audio/mp4",
								base64: Buffer.from("clip").toString("base64"),
							},
						],
					},
				]);
				const { value } = await iter.next();
				expect(value?.msg.case).toBe("ack");
				expect((value?.msg.value as Ack).ok).toBe(true);
			});

			it("Should adopt nothing until the last chunk lands, so a half-transferred theme is never activated", async () => {
				const themes = themeStoreFixture([]);
				const overlay = newOverlaySpy();
				const { onCommand, outbound } = newOnCommand(
					onCommandFixture({ themes: themes.store, overlay }),
				);
				const iter = outbound[Symbol.asyncIterator]();

				await onCommand(pushChunk({ seq: 0, total: 2, manifest: JSON.stringify(PUSHED_THEME) }));

				expect(themes.calls.pushed).toEqual([]);
				expect(overlay.calls.pushedAssets).toEqual([]);

				await onCommand(
					pushChunk({ seq: 1, total: 2, rel: "flocs/global/a/a.m4a", mime: "audio/mp4" }),
				);

				// The first thing ever sent back is the ack for the *finished* push - an early
				// ack would tell the server a theme had landed while it was still in flight.
				const { value } = await iter.next();
				expect((value?.msg.value as Ack).ok).toBe(true);
			});

			it("Should ack a refused asset path as failed, so a rejected push shows on the dashboard instead of silently doing nothing", async () => {
				const themes = themeStoreFixture([]);
				const { onCommand, outbound } = newOnCommand(onCommandFixture({ themes: themes.store }));
				const iter = outbound[Symbol.asyncIterator]();

				await onCommand(pushChunk({ seq: 0, total: 2, manifest: JSON.stringify(PUSHED_THEME) }));
				await onCommand(pushChunk({ seq: 1, total: 2, rel: "../../../.ssh/id_rsa", mime: "audio/mp4" }));

				const { value } = await iter.next();
				const ack = value?.msg.value as Ack;
				expect(ack.commandId).toBe("p1");
				expect(ack.ok).toBe(false);
				expect(ack.error.length).toBeGreaterThan(0);
				expect(themes.calls.pushed).toEqual([]);
			});
		});

		describe("activate", () => {
			it("Should grab the keyboard and report the theme it actually loaded, not the one requested", async () => {
				// loadTheme falls back when the named theme is missing - only "raven" exists in
				// this fixture, so requesting "flocs" must load and report "raven", or an
				// operator watching the roster would reason about a theme the client isn't
				// actually running.
				const logSpy = spyOn(console, "log").mockImplementation(() => {});
				const input = newInputSpy();
				const overlay = newOverlaySpy();
				const { onCommand, outbound, isActive } = newOnCommand(onCommandFixture({ input, overlay }));
				const iter = outbound[Symbol.asyncIterator]();

				await onCommand(activate("c1", "flocs"));

				expect(input.startCalls).toBe(1);
				expect(overlay.calls.themes).toHaveLength(1);
				expect((overlay.calls.themes[0] as { name: string }).name).toBe("raven");
				expect(isActive()).toBe(true);

				const { value } = await iter.next();
				expect(value?.msg.case).toBe("state");
				const state = value?.msg.value as StateChanged;
				expect(state.state).toBe(ClientState.ACTIVE);
				expect(state.theme).toBe("raven");

				const { value: ackValue } = await iter.next();
				const ack = ackValue?.msg.value as Ack;
				expect(ack.commandId).toBe("c1");
				expect(ack.ok).toBe(true);
				logSpy.mockRestore();
			});

			it("Should not grab the keyboard when loadTheme fails, since a half-completed activation would steal the keyboard for a client with no theme to show", async () => {
				// This is the leak path that matters most: an Activate that errors out before
				// input.Start() runs must never have called it in the first place.
				const errorSpy = spyOn(console, "error").mockImplementation(() => {});
				const input = newInputSpy();
				const noThemes = onCommandFixture({
					input,
					business: businessFixture({ themes: themeStoreFixture([]).store }).business,
				});
				const { onCommand, outbound, isActive } = newOnCommand(noThemes);
				const iter = outbound[Symbol.asyncIterator]();

				await onCommand(activate("c1", "raven"));

				expect(input.startCalls).toBe(0);
				expect(isActive()).toBe(false);

				const { value } = await iter.next();
				const ack = value?.msg.value as Ack;
				expect(ack.commandId).toBe("c1");
				expect(ack.ok).toBe(false);
				expect(ack.error.length).toBeGreaterThan(0);
				errorSpy.mockRestore();
			});

			it("Should release the keyboard and ack failed when input.Start() throws, since a half-registered grab must not be left standing", async () => {
				// Start() registers hotkeys one at a time - a throw partway through can leave
				// some already grabbed. Deleting the compensating Stop() call below breaks no
				// other test, which is exactly why this path needs one of its own.
				const input = newInputSpy({
					Start: () => {
						throw new Error("native registration exploded");
					},
				});
				const { onCommand, outbound, isActive } = newOnCommand(onCommandFixture({ input }));
				const iter = outbound[Symbol.asyncIterator]();

				await onCommand(activate("c1", "raven"));

				expect(input.stopCalls).toBe(1);
				expect(isActive()).toBe(false);

				const { value } = await iter.next();
				const ack = value?.msg.value as Ack;
				expect(ack.commandId).toBe("c1");
				expect(ack.ok).toBe(false);
				expect(ack.error.length).toBeGreaterThan(0);
			});

			it("Should not grab the keyboard again on a second Activate, but should still broadcast and re-announce the new theme", async () => {
				// Deleting the `!active` guard breaks no test either, unless both halves of
				// what it is for are pinned: no second Start(), and a theme switch while
				// already active keeps working.
				const logSpy = spyOn(console, "log").mockImplementation(() => {});
				const input = newInputSpy();
				const overlay = newOverlaySpy();
				const { business } = businessFixture({
					themes: themeStoreFixture([themeMock(), themeMock({ name: "other" })]).store,
				});
				const { onCommand, outbound, isActive } = newOnCommand(
					onCommandFixture({ input, overlay, business }),
				);
				const iter = outbound[Symbol.asyncIterator]();

				await onCommand(activate("c1", "raven"));
				await iter.next(); // state
				await iter.next(); // ack

				await onCommand(activate("c2", "other"));

				expect(input.startCalls).toBe(1);
				expect(isActive()).toBe(true);
				expect(overlay.calls.themes).toHaveLength(2);
				expect((overlay.calls.themes[1] as { name: string }).name).toBe("other");

				const { value } = await iter.next();
				expect(value?.msg.case).toBe("state");
				const state = value?.msg.value as StateChanged;
				expect(state.state).toBe(ClientState.ACTIVE);
				expect(state.theme).toBe("other");

				const { value: ackValue } = await iter.next();
				const ack = ackValue?.msg.value as Ack;
				expect(ack.commandId).toBe("c2");
				expect(ack.ok).toBe(true);
				logSpy.mockRestore();
			});
		});

		describe("deactivate", () => {
			it("Should hand the keyboard back", async () => {
				// A leaked registration here leaves the machine owner unable to type, in any
				// application, with no indication why and no recourse but killing a process
				// they may not know is running - the worst outcome this project can produce.
				const logSpy = spyOn(console, "log").mockImplementation(() => {});
				const input = newInputSpy();
				const { onCommand, outbound, isActive } = newOnCommand(onCommandFixture({ input }));
				const iter = outbound[Symbol.asyncIterator]();

				await onCommand(activate("c1", "raven"));
				await iter.next(); // state
				await iter.next(); // ack
				await onCommand(deactivate("c2"));

				expect(input.stopCalls).toBe(1);
				expect(isActive()).toBe(false);

				const { value } = await iter.next();
				expect(value?.msg.case).toBe("state");
				const state = value?.msg.value as StateChanged;
				expect(state.state).toBe(ClientState.PASSIVE);
				expect(state.theme).toBe("");

				const { value: ackValue } = await iter.next();
				const ack = ackValue?.msg.value as Ack;
				expect(ack.commandId).toBe("c2");
				expect(ack.ok).toBe(true);
				logSpy.mockRestore();
			});

			it("Should hand the keyboard back cleanly when the client was never activated", async () => {
				const input = newInputSpy();
				const { onCommand, isActive } = newOnCommand(onCommandFixture({ input }));

				await onCommand(deactivate("c1"));

				expect(input.stopCalls).toBe(1);
				expect(isActive()).toBe(false);
			});
		});

		describe("reannounceIfActive", () => {
			// index.ts calls this right after Hello on every (re)connect. The server rebuilds
			// its roster entry as PASSIVE for every new stream - it has no other way to know -
			// so a reconnect while genuinely active that skips this leaves the roster reporting
			// PASSIVE for a machine whose keyboard is actually grabbed, for as long as the new
			// connection stays up.
			it("Should send StateChanged ACTIVE with the currently loaded theme when active", async () => {
				const logSpy = spyOn(console, "log").mockImplementation(() => {});
				const { onCommand, outbound, reannounceIfActive } = newOnCommand(onCommandFixture());
				const iter = outbound[Symbol.asyncIterator]();

				await onCommand(activate("c1", "raven"));
				await iter.next(); // state
				await iter.next(); // ack

				reannounceIfActive();

				const { value } = await iter.next();
				expect(value?.msg.case).toBe("state");
				const state = value?.msg.value as StateChanged;
				expect(state.state).toBe(ClientState.ACTIVE);
				expect(state.theme).toBe("raven");
				logSpy.mockRestore();
			});

			it("Should send nothing while passive", () => {
				const { outbound, reannounceIfActive } = newOnCommand(onCommandFixture());
				const iter = outbound[Symbol.asyncIterator]();

				reannounceIfActive();

				const raced = Promise.race([
					iter.next(),
					new Promise<"nothing-sent">((resolve) => setTimeout(() => resolve("nothing-sent"), 50)),
				]);
				return raced.then((result) => expect(result).toBe("nothing-sent"));
			});
		});

		describe("forceDeactivate", () => {
			it("Should release the keyboard and clear isActive(), which is the dead-man's switch's entire payload when the server never comes back", async () => {
				// A re-announce on reconnect fixes the roster lying during an ordinary blip, but
				// does nothing if the server never returns - this is what actually gives the
				// keyboard back when nobody is left who can send Deactivate.
				const logSpy = spyOn(console, "log").mockImplementation(() => {});
				const input = newInputSpy();
				const { onCommand, isActive, forceDeactivate } = newOnCommand(onCommandFixture({ input }));

				await onCommand(activate("c1", "raven"));
				expect(isActive()).toBe(true);

				forceDeactivate();

				expect(input.stopCalls).toBe(1);
				expect(isActive()).toBe(false);
				logSpy.mockRestore();
			});
		});

		describe("via newControl", () => {
			// The tests above exercise onCommand directly. These go through the real Start()/
			// dial() path too, because isActive() and the hotkey grab/release are wired through
			// newControl, not onCommand alone - a gap the narrower "passive" test above cannot
			// catch (it only proves Start()/dial() never call input.Start(), which stays true
			// regardless of how activation itself is wired).
			it("Should grab the keyboard on a delivered Activate and hand it back on a delivered Deactivate", async () => {
				const errorSpy = spyOn(console, "error").mockImplementation(() => {});
				const logSpy = spyOn(console, "log").mockImplementation(() => {});
				const input = newInputSpy();
				const control = newTestControl({ input });
				control.Start();

				expect(control.isActive()).toBe(false);

				await control.onCommand(activate("c1", "raven"));
				expect(input.startCalls).toBe(1);
				expect(control.isActive()).toBe(true);

				await control.onCommand(deactivate("c2"));
				expect(input.stopCalls).toBe(1);
				expect(control.isActive()).toBe(false);

				control.Stop();
				await flush();
				errorSpy.mockRestore();
				logSpy.mockRestore();
			});
		});

		it("Should play a one-shot while passive, since a dormant client must still be able to make a sound", async () => {
			// One-shots must not depend on key capture, or the whole point of a dormant
			// client - triggering a sound on a machine nobody is typing on - disappears.
			//
			// See the previous test for why console output is silenced here.
			const errorSpy = spyOn(console, "error").mockImplementation(() => {});
			const logSpy = spyOn(console, "log").mockImplementation(() => {});
			const overlay = newOverlaySpy({
				GetTargetUnderCursor: () => ({ displayId: 1, position: { x: 10, y: 20 }, scaleFactor: 2 }),
			});
			const input = newInputSpy();
			const control = newTestControl({ overlay, input });
			control.Start();

			await control.onCommand(playSound("c1", "raven", "raven/global/gael/gael.m4a"));

			expect(overlay.calls.bursts).toHaveLength(1);
			expect((overlay.calls.bursts[0]?.burst as Burst).sound?.rel).toBe("raven/global/gael/gael.m4a");
			// still passive: PlaySound must never grab the keyboard.
			expect(input.startCalls).toBe(0);
			control.Stop();
			await flush();
			errorSpy.mockRestore();
			logSpy.mockRestore();
		});

		it("Should ack PlaySound ok, and burst the display under the cursor", async () => {
			const overlay = newOverlaySpy({
				GetTargetUnderCursor: () => ({ displayId: 7, position: { x: 1, y: 2 }, scaleFactor: 2 }),
			});
			const { onCommand, outbound } = newOnCommand(onCommandFixture({ overlay }));
			const iter = outbound[Symbol.asyncIterator]();

			await onCommand(playSound("c1", "raven", "raven/global/gael/gael.m4a"));

			const { value } = await iter.next();
			const ack = value?.msg.value as Ack;
			expect(ack.commandId).toBe("c1");
			expect(ack.ok).toBe(true);
			expect(overlay.calls.bursts[0]?.displayId).toBe(7);
		});

		it("Should ack PlaySound as failed with an honest reason when the asset does not exist, so the dashboard operator sees why nothing played", async () => {
			const overlay = newOverlaySpy({
				GetTargetUnderCursor: () => ({ displayId: 1, position: { x: 0, y: 0 }, scaleFactor: 1 }),
			});
			const { onCommand, outbound } = newOnCommand(onCommandFixture({ overlay }));
			const iter = outbound[Symbol.asyncIterator]();

			await onCommand(playSound("c1", "raven", "raven/global/nobody/nobody.m4a"));

			const { value } = await iter.next();
			const ack = value?.msg.value as Ack;
			expect(ack.ok).toBe(false);
			expect(ack.error).toBe("asset not found");
			expect(overlay.calls.bursts).toHaveLength(0);
		});

		it("Should ack PlaySound as failed when there is no display under the cursor", async () => {
			// The default overlay spy's GetTargetUnderCursor returns null - no display.
			const { onCommand, outbound } = newOnCommand(onCommandFixture());
			const iter = outbound[Symbol.asyncIterator]();

			await onCommand(playSound("c1", "raven", "raven/global/gael/gael.m4a"));

			const { value } = await iter.next();
			const ack = value?.msg.value as Ack;
			expect(ack.ok).toBe(false);
			expect(ack.error).toBe("no display under cursor");
		});

		it("Should trigger a full BurstKey via business.onKeyPressed untouched, so the anti-repeat histories apply to remote bursts exactly as to local ones", async () => {
			const { business, ctx } = businessFixture();
			await business.loadTheme(ctx, { name: "raven" });
			const overlay = newOverlaySpy({
				GetTargetUnderCursor: () => ({ displayId: 3, position: { x: 5, y: 6 }, scaleFactor: 2 }),
			});
			const { onCommand, outbound } = newOnCommand(onCommandFixture({ business, overlay }));
			const iter = outbound[Symbol.asyncIterator]();

			await onCommand(burstKey("c1", "a"));

			const { value } = await iter.next();
			const ack = value?.msg.value as Ack;
			expect(ack.ok).toBe(true);
			expect((overlay.calls.bursts[0]?.burst as Burst).sound?.rel).toBe("raven/a/manu-a.m4a");
		});

		it("Should ack BurstKey as failed when there is no display under the cursor, without touching the keyboard", async () => {
			const { business, ctx } = businessFixture();
			await business.loadTheme(ctx, { name: "raven" });
			const { onCommand, outbound } = newOnCommand(onCommandFixture({ business }));
			const iter = outbound[Symbol.asyncIterator]();

			await onCommand(burstKey("c1", "a"));

			const { value } = await iter.next();
			const ack = value?.msg.value as Ack;
			expect(ack.ok).toBe(false);
			expect(ack.error).toBe("no display under cursor");
		});

		it("Should resolve a parked outbound consumer instead of stranding it, when the queue is closed", async () => {
			// The outbound queue's consumer is connect-node's own internal reader, parked in
			// `next()` whenever nothing is queued yet. A reconnect (or Stop()) that discards
			// that pending promise without resolving it leaves it dangling forever - not just
			// a leak, but (per the reconnect path in index.ts) a stale reader that could in
			// principle steal a later attempt's Hello, since the queue is reused across dials.
			const { outbound, closeOutbound } = newOnCommand(onCommandFixture());
			const iter = outbound[Symbol.asyncIterator]();

			const parked = iter.next(); // nothing queued yet - parks awaiting a future send()

			closeOutbound();

			const result = await Promise.race([
				parked,
				new Promise<"timed-out">((resolve) => setTimeout(() => resolve("timed-out"), 200)),
			]);

			expect(result).not.toBe("timed-out");
			expect((result as IteratorResult<unknown>).done).toBe(true);
		});

		it("Should implement throw() on the outbound iterable, since connect-node's gRPC transport requires it for every streaming call", () => {
			// Verified live, against the real server in server/: without this, EVERY real
			// connection failed immediately with "ConnectError: [internal] AsyncIterable
			// does not implement throw" - connect-node's transport.js pipes the request
			// iterable with `{ propagateDownStreamError: true }` unconditionally, which
			// calls makeIterableAbortable() on it and throws synchronously if `.throw` is
			// missing. A refused connection (ECONNREFUSED) never reaches this code path,
			// which is how the original implementation shipped with this undetected.
			const { outbound } = newOnCommand(onCommandFixture());

			expect(() => makeIterableAbortable(outbound)).not.toThrow();
		});
	});
});
