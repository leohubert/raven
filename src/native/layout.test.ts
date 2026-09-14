import { describe, expect, it } from "bun:test";

import { getLayoutIndex } from "./layout";
import { LAYOUT_KEYS_MOCK } from "./mock.test";

describe("native", () => {
	describe("getLayoutIndex", () => {
		it("Should map a character to its physical key code", () => {
			const index = getLayoutIndex(LAYOUT_KEYS_MOCK);
			expect(index.get("p")).toBe(35);
			expect(index.get("j")).toBe(38);
		});

		it("Should prefer the main row over the numeric keypad, which produces the same characters", () => {
			const index = getLayoutIndex(LAYOUT_KEYS_MOCK);
			// '.' is 47 on the main row and 65 on the keypad
			expect(index.get(".")).toBe(47);
			// digits are 18..29 on the main row and 82..92 on the keypad
			expect(index.get("1")).toBe(18);
		});

		it("Should report a character the layout cannot produce as absent, not as key 0", () => {
			const index = getLayoutIndex(LAYOUT_KEYS_MOCK);
			expect(index.has("é")).toBe(false);
			expect(index.get("é")).toBeUndefined();
		});

		it("Should be driven by the live layout, so the same character resolves differently on AZERTY", () => {
			// The physical key that types 'a' on QWERTY types 'q' on AZERTY. Registering a
			// hardcoded QWERTY code is upstream raven's issue #2.
			const qwerty = getLayoutIndex([{ code: 0, ch: "a" }, { code: 12, ch: "q" }]);
			const azerty = getLayoutIndex([{ code: 0, ch: "q" }, { code: 12, ch: "a" }]);
			expect(qwerty.get("a")).toBe(0);
			expect(azerty.get("a")).toBe(12);
		});
	});
});
