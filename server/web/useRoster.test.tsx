import { afterEach, beforeEach, describe, expect, it, vi } from "bun:test";
import { create } from "@bufbuild/protobuf";
import { act, cleanup, render, screen } from "@testing-library/react";
import { ClientInfoSchema, ClientState, RosterSchema, ThemeListSchema, type Roster } from "../../src/gen/raven/control/v1/control_pb";
import type { RavenAdminClient } from "./actions";
import { useRoster } from "./useRoster";

// Fake timers make the backoff wait instant and deterministic: with real timers, a busy suite
// (144 tests, some doing real I/O) can delay setTimeout delivery long enough that two states
// meant to be a full second apart land in the same DOM snapshot, and the test can't tell them
// apart any more.
beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

function makeRoster(clientCount: number): Roster {
	return create(RosterSchema, {
		clients: Array.from({ length: clientCount }, (_, i) =>
			create(ClientInfoSchema, {
				clientId: `client-${i}`,
				hostname: `host-${i}`,
				state: ClientState.PASSIVE,
				theme: "",
				themes: [],
				displays: [],
				connectedAtUnixMs: 0n,
			}),
		),
	});
}

// Yields one snapshot, then never produces another - a live connection idling with nothing new
// to report. Used for the *second* attempt in each test below, so the reconnect has a stable
// end state to land on instead of racing another end-or-throw.
async function* liveStream(roster: Roster): AsyncGenerator<Roster> {
	yield roster;
	await new Promise<never>(() => {});
}

async function* endingStream(roster: Roster): AsyncGenerator<Roster> {
	yield roster;
}

async function* throwingStream(err: Error): AsyncGenerator<Roster> {
	throw err;
}

function makeFakeClient(streamsByAttempt: Array<() => AsyncIterable<Roster>>): {
	client: RavenAdminClient;
	attemptCount: () => number;
} {
	let attempts = 0;
	const client: RavenAdminClient = {
		watchClients: () => {
			const attempt = attempts;
			attempts++;
			const makeStream = streamsByAttempt[attempt] ?? streamsByAttempt[streamsByAttempt.length - 1];
			if (!makeStream) throw new Error("test bug: no stream configured for this attempt");
			return makeStream();
		},
		listPushableThemes: () => Promise.resolve(create(ThemeListSchema, { themes: [] })),
		sendCommand: () => {
			throw new Error("useRoster must never call sendCommand");
		},
	};
	return { client, attemptCount: () => attempts };
}

function Harness({ client }: { client: RavenAdminClient }) {
	const roster = useRoster(client);
	return (
		<div>
			<span data-testid="connection-state">{roster.connectionState}</span>
			<span data-testid="status-message">{roster.statusMessage}</span>
			<span data-testid="client-count">{roster.clients.length}</span>
		</div>
	);
}

// `vi.advanceTimersByTime` only fires due timers; it does not itself drain the real microtask
// queue that the async generator/promise chain driving `watchRoster` runs on, so each step
// still needs a moment for that chain to actually progress.
async function flushMicrotasks(): Promise<void> {
	for (let i = 0; i < 10; i++) await Promise.resolve();
}

describe("web", () => {
	describe("useRoster", () => {
		it("Should reconnect after the stream ends, so the dashboard never keeps showing a roster nothing can confirm is still current", async () => {
			const { client, attemptCount } = makeFakeClient([() => endingStream(makeRoster(1)), () => liveStream(makeRoster(2))]);
			render(<Harness client={client} />);
			await act(() => flushMicrotasks());

			// The first stream ended cleanly (no error) right after its one snapshot - a status
			// that stayed "live" here would be lying to the operator about a connection that no
			// longer exists.
			expect(screen.getByTestId("connection-state").textContent).toBe("disconnected");
			expect(screen.getByTestId("status-message").textContent).toBe("disconnected, retrying in 1s");
			expect(attemptCount()).toBe(1);

			// The retry loop must actually re-open the stream after the backoff, not just report
			// "disconnected" and give up - this is what the reviewer's `return;` mutation removes.
			await act(async () => {
				vi.advanceTimersByTime(1000);
				await flushMicrotasks();
			});

			expect(attemptCount()).toBe(2);
			// And the reconnect must be real, not cosmetic: the pill returns to "live" carrying
			// the *new* stream's roster, not a stale one nothing can confirm.
			expect(screen.getByTestId("connection-state").textContent).toBe("live");
			expect(screen.getByTestId("status-message").textContent).toBe("live");
			expect(screen.getByTestId("client-count").textContent).toBe("2");
		});

		it("Should reconnect after the stream throws, so a dropped connection recovers the same way a clean end does", async () => {
			const { client, attemptCount } = makeFakeClient([
				() => throwingStream(new Error("simulated transport failure")),
				() => liveStream(makeRoster(1)),
			]);
			render(<Harness client={client} />);
			await act(() => flushMicrotasks());

			expect(screen.getByTestId("connection-state").textContent).toBe("disconnected");
			expect(screen.getByTestId("status-message").textContent).toBe("disconnected, retrying in 1s");
			expect(attemptCount()).toBe(1);

			await act(async () => {
				vi.advanceTimersByTime(1000);
				await flushMicrotasks();
			});

			expect(attemptCount()).toBe(2);
			expect(screen.getByTestId("connection-state").textContent).toBe("live");
			expect(screen.getByTestId("client-count").textContent).toBe("1");
		});
	});
});
