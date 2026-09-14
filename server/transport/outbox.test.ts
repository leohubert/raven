import { describe, expect, it } from "bun:test";
import { newOutbox } from "./outbox";

describe("transport", () => {
	describe("outbox", () => {
		it("Should deliver a message pushed before anyone awaits", async () => {
			const outbox = newOutbox<number>();
			outbox.push(1);
			outbox.close();
			const seen: number[] = [];
			for await (const v of outbox) seen.push(v);
			expect(seen).toEqual([1]);
		});

		it("Should end iteration when closed while a consumer is waiting", async () => {
			const outbox = newOutbox<number>();
			const seen: number[] = [];
			const done = (async () => {
				for await (const v of outbox) seen.push(v);
			})();
			outbox.close();
			await done; // resolves rather than hanging
			expect(seen).toEqual([]);
		});

		it("Should still deliver everything buffered before close ends iteration", async () => {
			const outbox = newOutbox<number>();
			outbox.push(1);
			outbox.push(2);
			outbox.close();
			const seen: number[] = [];
			for await (const v of outbox) seen.push(v);
			expect(seen).toEqual([1, 2]);
		});
	});
});
