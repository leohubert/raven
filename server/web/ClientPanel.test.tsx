import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { create } from "@bufbuild/protobuf";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	ClientInfoSchema,
	ClientState,
	CommandResultSchema,
	type ClientInfo,
	type CommandResult,
} from "../../src/gen/raven/control/v1/control_pb";
import { ravenAdminClient } from "./actions";
import { ClientPanel } from "./ClientPanel";

afterEach(() => {
	cleanup();
});

function makeClient(overrides: { clientId?: string; hostname?: string; state: ClientState }): ClientInfo {
	return create(ClientInfoSchema, {
		clientId: overrides.clientId ?? "client-1",
		hostname: overrides.hostname ?? "host-1",
		state: overrides.state,
		theme: "theme-1",
		themes: ["theme-1"],
		displays: [],
		connectedAtUnixMs: 0n,
	});
}

function Roster({ clients }: { clients: ClientInfo[] }) {
	return (
		<ul>
			{clients.map((client) => (
				<ClientPanel key={client.clientId} client={client} pushableThemes={["theme-1"]} />
			))}
		</ul>
	);
}

describe("web", () => {
	describe("ClientPanel", () => {
		it("Should render the state the client reported, not one the operator asked for", () => {
			const { rerender } = render(<ClientPanel client={makeClient({ state: ClientState.PASSIVE })} pushableThemes={[]} />);
			expect(screen.getByText("PASSIVE")).toBeDefined();

			// The badge has exactly one input - `client.state` from the latest WatchClients
			// snapshot. sendCommand (below) must never feed this badge; this pins the behaviour
			// so a regression there fails loud.
			rerender(<ClientPanel client={makeClient({ state: ClientState.ACTIVE })} pushableThemes={[]} />);
			expect(screen.getByText("ACTIVE")).toBeDefined();
			expect(screen.queryByText("PASSIVE")).toBeNull();

			// Colour is the operator's primary signal at a glance - a badge whose label says
			// ACTIVE but whose classes render the error (red) tone would mislead exactly the
			// operator this pill exists to inform, and the label-only assertions above cannot
			// catch that.
			const badge = screen.getByText("ACTIVE");
			expect(badge.className).toContain("bg-(--active-bg)");
			expect(badge.className).toContain("text-(--active)");
			expect(badge.className).not.toContain("bg-(--error-bg)");
		});

		it("Should show the acked state, not the commanded one", async () => {
			const user = userEvent.setup();
			let resolveSendCommand!: (result: CommandResult) => void;
			const sendCommandSpy = spyOn(ravenAdminClient, "sendCommand").mockReturnValue(
				new Promise((resolve) => {
					resolveSendCommand = resolve;
				}),
			);

			try {
				render(<ClientPanel client={makeClient({ state: ClientState.PASSIVE })} pushableThemes={["theme-1"]} />);
				await user.click(screen.getByRole("button", { name: "Activate" }));

				// `SendCommand` is still in flight (pending) here. A badge that flips to ACTIVE
				// on the click itself, before any ack, would tell an operator a client is armed
				// when it has confirmed nothing of the sort.
				expect(screen.getByText("PASSIVE")).toBeDefined();
				expect(screen.queryByText("ACTIVE")).toBeNull();

				resolveSendCommand(create(CommandResultSchema, { accepted: true, error: "", commandId: "" }));
				await waitFor(() => expect(screen.getByText("Activate: accepted")).toBeDefined());

				// `SendCommand` returning `accepted: true` means the pool queued the command, not
				// that the client obeyed it - the badge must not move here either.
				expect(screen.getByText("PASSIVE")).toBeDefined();
				expect(screen.queryByText("ACTIVE")).toBeNull();
			} finally {
				sendCommandSpy.mockRestore();
			}
		});

		it("Should keep a half-typed sound path when another client's state changes", async () => {
			const user = userEvent.setup();
			const clientA = makeClient({ clientId: "client-a", hostname: "host-a", state: ClientState.PASSIVE });
			const clientB = makeClient({ clientId: "client-b", hostname: "host-b", state: ClientState.PASSIVE });

			const { rerender } = render(<Roster clients={[clientA, clientB]} />);
			const panelA = screen.getByTitle("client-a").closest("li");
			if (!panelA) throw new Error("panel for client-a not found");
			const relInput = within(panelA).getByLabelText("Sound file, relative to the theme") as HTMLInputElement;
			await user.type(relInput, "a/manu-a.m4a");
			expect(relInput.value).toBe("a/manu-a.m4a");

			// This is the exact failure the hand-written reconciler existed to prevent: a fresh
			// WatchClients snapshot in which only client B's state differs - note client A is a
			// brand-new (but value-identical) object, exactly as a real push would deliver it -
			// must not recreate client A's panel.
			const unchangedA = makeClient({ clientId: "client-a", hostname: "host-a", state: ClientState.PASSIVE });
			const changedB = makeClient({ clientId: "client-b", hostname: "host-b", state: ClientState.ACTIVE });
			rerender(<Roster clients={[unchangedA, changedB]} />);

			expect(relInput.value).toBe("a/manu-a.m4a");
			expect(document.activeElement).toBe(relInput);
		});
	});
});
