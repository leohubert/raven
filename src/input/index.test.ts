import { describe, expect, it } from "bun:test";

import { BARE_KEY_BLOCKLIST, CONTROL_BINDINGS } from "./hotkeys";
import { BURST_MOCK, inputFixture } from "./fixture.test";
import { LAYOUT_KEYS_MOCK } from "../native/mock.test";
import { getLayoutIndex } from "../native";

/** Find the hotkey id the input layer assigned to a given char + modifier pair. */
function idFor(
	native: ReturnType<typeof inputFixture>["native"],
	char: string,
	modifiers: number,
) {
	const code = getLayoutIndex(LAYOUT_KEYS_MOCK).get(char);
	const found = native.calls.registered.find(
		(r) => r.keyCode === code && r.modifiers === modifiers,
	);
	return found?.id;
}

describe("input", () => {
	describe("Start", () => {
		it("Should grab every printable key on the layout as a bare hotkey, which is how raven reacts to typing", () => {
			const { input, native } = inputFixture();
			const { bare } = input.Start();

			const printable = getLayoutIndex(LAYOUT_KEYS_MOCK);
			const expected = [...printable.keys()].filter((c) => !BARE_KEY_BLOCKLIST.has(c)).length;
			expect(bare).toBe(expected);
			expect(native.calls.registered.filter((r) => r.modifiers === 0)).toHaveLength(expected);
		});

		it("Should never grab space as a bare key, because that would make the machine unusable", () => {
			const { input, native } = inputFixture();
			input.Start();

			const spaceCode = getLayoutIndex(LAYOUT_KEYS_MOCK).get(" ");
			expect(spaceCode).toBeDefined();
			expect(
				native.calls.registered.some((r) => r.keyCode === spaceCode && r.modifiers === 0),
			).toBe(false);
		});

		it("Should register the control hotkeys before the bare keys, so a combination wins over the plain key", () => {
			const { input, native } = inputFixture();
			input.Start();

			const firstBareIndex = native.calls.registered.findIndex((r) => r.modifiers === 0);
			const lastControlIndex = native.calls.registered.reduce(
				(acc, r, i) => (r.modifiers !== 0 ? i : acc),
				-1,
			);
			expect(lastControlIndex).toBeLessThan(firstBareIndex);
		});

		it("Should skip a control binding whose character the layout cannot produce", () => {
			const { input } = inputFixture();
			const { control } = input.Start();
			// every CONTROL_BINDINGS char is present in the mock layout
			expect(control).toBe(CONTROL_BINDINGS.length);
		});
	});

	describe("bare key", () => {
		it("Should send a burst to the display under the cursor", () => {
			const { input, native, overlayCalls, businessCalls } = inputFixture();
			input.Start();

			native.fire(idFor(native, "j", 0)!);

			expect(businessCalls.presses).toEqual(["j"]);
			expect(overlayCalls.bursts).toEqual([{ displayId: 5, burst: BURST_MOCK }]);
		});

		it("Should do nothing when the cursor is not over any overlay, rather than guessing a window", () => {
			const { input, native, overlayCalls, businessCalls } = inputFixture({ target: null });
			input.Start();

			native.fire(idFor(native, "j", 0)!);

			expect(businessCalls.presses).toEqual([]);
			expect(overlayCalls.bursts).toEqual([]);
		});

		it("Should send nothing when business decides there is nothing to show", () => {
			const { input, native, overlayCalls } = inputFixture({ burst: null });
			input.Start();

			native.fire(idFor(native, "j", 0)!);

			expect(overlayCalls.bursts).toEqual([]);
		});

		it("Should ignore an unknown hotkey id instead of throwing inside the native callback", () => {
			const { input, native } = inputFixture();
			input.Start();
			expect(() => native.fire(9999)).not.toThrow();
		});
	});

	describe("control hotkeys", () => {
		it("Should quit on OPTION+P", () => {
			const { input, native, quit } = inputFixture();
			input.Start();
			native.fire(idFor(native, "p", 0x0800)!);
			expect(quit.count).toBe(1);
		});

		it("Should also quit on the backup binding, so a taken combination cannot strand a dockless app", () => {
			const { input, native, quit } = inputFixture();
			input.Start();
			native.fire(idFor(native, "q", 0x0800)!);
			expect(quit.count).toBe(1);
		});

		it("Should cycle the theme and tell the renderer to preload the new one", async () => {
			const { input, native, overlayCalls, businessCalls } = inputFixture();
			input.Start();

			native.fire(idFor(native, "t", 0x0800)!);
			await Bun.sleep(0);

			expect(businessCalls.cycles).toBe(1);
			expect(overlayCalls.themes.map((t) => t.name)).toEqual(["toad"]);
		});

		it("Should toggle click-through off and back on", () => {
			const { input, native, overlayCalls } = inputFixture();
			input.Start();
			const id = idFor(native, "m", 0x0800)!;

			expect(input.isClickThrough()).toBe(true);
			native.fire(id);
			expect(input.isClickThrough()).toBe(false);
			native.fire(id);
			expect(input.isClickThrough()).toBe(true);
			expect(overlayCalls.clickThrough).toEqual([false, true]);
		});

		it("Should show the version on OPTION+V", () => {
			const { input, native, version } = inputFixture();
			input.Start();
			native.fire(idFor(native, "v", 0x0800)!);
			expect(version.count).toBe(1);
		});
	});

	describe("Stop", () => {
		it("Should release every hotkey, which the original never did on quit", () => {
			const { input, native } = inputFixture();
			input.Start();
			input.Stop();
			expect(native.calls.unregisteredAll).toBe(1);
		});

		it("Should ignore a hotkey that fires after Stop, so a late event cannot resurrect the overlay", () => {
			const { input, native, overlayCalls } = inputFixture();
			input.Start();
			const bare = idFor(native, "j", 0)!;
			input.Stop();

			native.fire(bare);

			expect(overlayCalls.bursts).toEqual([]);
		});
	});
});
