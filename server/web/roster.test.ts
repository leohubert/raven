import { describe, expect, it } from "bun:test";
import { diffClientIds } from "./roster";

describe("web", () => {
	describe("diffClientIds", () => {
		it("Should report nothing added or removed when the roster is unchanged", () => {
			const result = diffClientIds(new Set(["a", "b"]), [{ clientId: "a" }, { clientId: "b" }]);
			expect(result).toEqual({ added: [], removed: [] });
		});

		it("Should report a newly connected client as added, without disturbing existing ones", () => {
			const result = diffClientIds(new Set(["a"]), [{ clientId: "a" }, { clientId: "b" }]);
			expect(result).toEqual({ added: ["b"], removed: [] });
		});

		it("Should report a disconnected client as removed", () => {
			const result = diffClientIds(new Set(["a", "b"]), [{ clientId: "a" }]);
			expect(result).toEqual({ added: [], removed: ["b"] });
		});

		it("Should report both an add and a remove from the same snapshot", () => {
			const result = diffClientIds(new Set(["a", "b"]), [{ clientId: "a" }, { clientId: "c" }]);
			expect(result.added).toEqual(["c"]);
			expect(result.removed).toEqual(["b"]);
		});

		it("Should not treat a reorder of the same clients as a change", () => {
			// The renderer must not recreate a row just because the pool's Map iterated in a
			// different order - only membership changes justify touching a row's DOM.
			const result = diffClientIds(new Set(["a", "b"]), [{ clientId: "b" }, { clientId: "a" }]);
			expect(result).toEqual({ added: [], removed: [] });
		});
	});
});
