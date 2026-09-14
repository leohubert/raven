import { create } from "@bufbuild/protobuf";
import { describe, expect, it, spyOn } from "bun:test";

import {
	ActivateSchema,
	ClientState,
	ServerToClientSchema,
	type Ack,
	type ClientToServer,
	type StateChanged,
} from "../gen/raven/control/v1/control_pb";
import { newFakeControlServer, newInputSpy, newTestControl } from "./fixture.test";

function activate(commandId: string, theme: string) {
	return create(ServerToClientSchema, {
		msg: { case: "activate", value: create(ActivateSchema, { commandId, theme }) },
	});
}

/** Polls until `predicate` is true or `timeoutMs` elapses, for events driven by a real server. */
async function waitUntil(predicate: () => boolean, timeoutMs = 4000): Promise<void> {
	const start = Date.now();
	while (!predicate()) {
		if (Date.now() - start > timeoutMs) throw new Error("waitUntil: timed out");
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
}

describe("control", () => {
	describe("newControl reconnect", () => {
		// These go through a real gRPC/HTTP2 connection (see newFakeControlServer) rather
		// than the dead-port setup the rest of this file's tests use, because the two
		// behaviours below only exist around an actual disconnect/reconnect cycle.

		it("Should re-announce ACTIVE state right after Hello on reconnect, and never touch the keyboard again while contact holds", async () => {
			// The server rebuilds its roster entry as PASSIVE for every new stream - it has no
			// other way to know otherwise. Without a re-announce, a machine that is genuinely
			// ACTIVE (keyboard grabbed) reports PASSIVE on the dashboard for as long as the new
			// connection stays up - the exact inversion of the roster's whole purpose.
			const logSpy = spyOn(console, "log").mockImplementation(() => {});
			const errorSpy = spyOn(console, "error").mockImplementation(() => {});
			const server = newFakeControlServer();
			const port = await server.listen();
			const input = newInputSpy();
			// Generous on purpose: this test's reconnect must land well inside it, or the
			// dead-man's switch would fire and confound what this test is actually checking.
			const control = newTestControl({ controlUrl: `http://127.0.0.1:${port}`, input, deadMansSwitchMs: 10_000 });
			control.Start();

			await waitUntil(() => server.received.some((m) => m.msg.case === "hello"));

			server.send(activate("c1", "raven"));
			await waitUntil(() =>
				server.received.some((m) => m.msg.case === "ack" && (m.msg.value as Ack).commandId === "c1"),
			);
			expect(control.isActive()).toBe(true);
			expect(input.startCalls).toBe(1);

			const beforeDrop = server.received.length;
			server.dropConnection();

			// A fresh Hello, followed by the re-announce, on the new stream.
			await waitUntil(() => server.received.length > beforeDrop + 1);
			const afterHello = server.received.slice(beforeDrop);
			expect(afterHello[0]?.msg.case).toBe("hello");
			const reannounced = afterHello.find((m: ClientToServer) => m.msg.case === "state");
			expect(reannounced).toBeDefined();
			const state = reannounced?.msg.value as StateChanged;
			expect(state.state).toBe(ClientState.ACTIVE);
			expect(state.theme).toBe("raven");

			// The whole point: still active, keyboard never released or re-grabbed.
			expect(control.isActive()).toBe(true);
			expect(input.startCalls).toBe(1);
			expect(input.stopCalls).toBe(0);

			control.Stop();
			await server.close();
			logSpy.mockRestore();
			errorSpy.mockRestore();
		}, 10_000);

		it("Should release the keyboard if the server never comes back within the dead-man's-switch threshold", async () => {
			// A re-announce on reconnect fixes the roster lying during a recoverable blip, but
			// does nothing if the server is simply gone - dial() then retries forever, and
			// without this, the keyboard stays grabbed with no way for anyone to send
			// Deactivate. That is the worst outcome this project can produce, so this is the
			// test that actually matters most in this file.
			const logSpy = spyOn(console, "log").mockImplementation(() => {});
			const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
			const errorSpy = spyOn(console, "error").mockImplementation(() => {});
			const server = newFakeControlServer();
			const port = await server.listen();
			const input = newInputSpy();
			const control = newTestControl({ controlUrl: `http://127.0.0.1:${port}`, input, deadMansSwitchMs: 150 });
			control.Start();

			await waitUntil(() => server.received.some((m) => m.msg.case === "hello"));
			server.send(activate("c1", "raven"));
			await waitUntil(() =>
				server.received.some((m) => m.msg.case === "ack" && (m.msg.value as Ack).commandId === "c1"),
			);
			expect(control.isActive()).toBe(true);

			// Contact lost. The switch is armed right here, on a 150ms threshold - well
			// inside dial()'s own 1000ms first retry, so this proves the switch itself fires
			// contact-loss, not merely a slow reconnect.
			server.dropConnection();

			await waitUntil(() => input.stopCalls === 1, 4000);
			expect(control.isActive()).toBe(false);

			control.Stop();
			await server.close();
			logSpy.mockRestore();
			warnSpy.mockRestore();
			errorSpy.mockRestore();
		}, 10_000);
	});
});
