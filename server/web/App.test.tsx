import { afterEach, describe, expect, it } from "bun:test";
import { create } from "@bufbuild/protobuf";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientInfoSchema, ClientState, type ClientInfo } from "../../src/gen/raven/control/v1/control_pb";
import { App } from "./App";
import type { RosterState } from "./useRoster";

// App.tsx's `key={client.clientId}` on ClientPanel is what this test exists to pin: it is the
// only thing standing between a reordered roster push and a panel getting its DOM node (and
// with it, any in-progress input) handed to a different client. Injecting `useRosterState` lets
// this test drive App's own render with a roster we control, rather than duplicating App's
// roster shape in a local harness where App.tsx's actual key expression is never exercised.
let rosterState: RosterState = { clients: [], connectionState: "live", statusMessage: "live", themes: ["theme-1"], themesError: null };
const useRosterState = () => rosterState;

afterEach(() => {
	cleanup();
});

function makeClient(overrides: { clientId: string; hostname: string; state: ClientState }): ClientInfo {
	return create(ClientInfoSchema, {
		clientId: overrides.clientId,
		hostname: overrides.hostname,
		state: overrides.state,
		theme: "theme-1",
		themes: ["theme-1"],
		displays: [],
		connectedAtUnixMs: 0n,
	});
}

function panelFor(clientId: string): HTMLElement {
	const panel = screen.getByTitle(clientId).closest("li");
	if (!panel) throw new Error(`panel for ${clientId} not found`);
	return panel;
}

describe("web", () => {
	describe("App", () => {
		it("Should keep a half-typed sound path in its own panel when a roster push reorders the same clients", async () => {
			const user = userEvent.setup();
			const clientA = makeClient({ clientId: "client-a", hostname: "host-a", state: ClientState.PASSIVE });
			const clientB = makeClient({ clientId: "client-b", hostname: "host-b", state: ClientState.PASSIVE });

			rosterState = { clients: [clientA, clientB], connectionState: "live", statusMessage: "live", themes: ["theme-1"], themesError: null };
			const { rerender } = render(<App useRosterState={useRosterState} />);

			const relInput = within(panelFor("client-a")).getByLabelText("Sound file, relative to the theme");
			await user.type(relInput, "a/manu-a.m4a");

			// Same two clients, same values, only the order changed - the exact case
			// `diffClientIds`'s "Should not treat a reorder of the same clients as a change"
			// protected. Re-querying client A's panel by identity (its title attribute) after
			// the push, rather than reusing the `relInput` reference above, is required here:
			// with a broken (index-based) key, that stale reference would still read the typed
			// value while actually now belonging to client B's slot.
			rosterState = {
				clients: [
					makeClient({ clientId: "client-b", hostname: "host-b", state: ClientState.PASSIVE }),
					makeClient({ clientId: "client-a", hostname: "host-a", state: ClientState.PASSIVE }),
				],
				connectionState: "live",
				statusMessage: "live",
				themes: ["theme-1"],
				themesError: null,
			};
			rerender(<App useRosterState={useRosterState} />);

			const relInputAfter = within(panelFor("client-a")).getByLabelText(
				"Sound file, relative to the theme",
			) as HTMLInputElement;
			expect(relInputAfter.value).toBe("a/manu-a.m4a");
		});

		// The server-side companion of pool.test.ts's "Should reflect the client's acked state,
		// not the commanded one". A dropped stream is the other way the roster can lie: every
		// badge keeps asserting a state that nothing is confirming any more, and the operator
		// acts on a machine they believe is armed. The roster carries the disclaimer rather than
		// each panel because `ClientInfo` has no last-seen field - what went stale is the
		// snapshot, and saying anything per-client would be inventing data the server never sent.
		it("Should mark the roster as unconfirmed once the stream drops, so a stale badge is never read as live", () => {
			const client = makeClient({ clientId: "client-a", hostname: "host-a", state: ClientState.ACTIVE });

			rosterState = { clients: [client], connectionState: "live", statusMessage: "live", themes: ["theme-1"], themesError: null };
			const { rerender } = render(<App useRosterState={useRosterState} />);

			const roster = screen.getByRole("list", { name: "Connected clients" });
			const notice = screen.getByText(/no longer being confirmed/i);
			expect(roster.dataset.stale).toBe("false");
			expect(notice.hidden).toBe(true);

			rosterState = {
				clients: [client],
				connectionState: "disconnected",
				statusMessage: "disconnected, retrying in 1s",
				themes: ["theme-1"],
				themesError: null,
			};
			rerender(<App useRosterState={useRosterState} />);

			expect(roster.dataset.stale).toBe("true");
			expect(notice.hidden).toBe(false);
			// The panel still says ACTIVE: the last snapshot is the only truth available, and
			// blanking it would be inventing a state change the client never reported.
			expect(within(panelFor("client-a")).getByText("ACTIVE")).toBeDefined();
		});

		// "connecting…" on an empty first load is the header pill's job; a roster with nothing in
		// it has no stale claim to disclaim, and the notice would just be noise on arrival.
		it("Should not disclaim an empty roster that has never connected", () => {
			rosterState = { clients: [], connectionState: "connecting", statusMessage: "connecting…", themes: [], themesError: null };
			render(<App useRosterState={useRosterState} />);

			expect(screen.getByRole("list", { name: "Connected clients" }).dataset.stale).toBe("false");
			expect(screen.getByText(/no longer being confirmed/i).hidden).toBe(true);
		});
	});
});
