import { createServer as createH2Server } from "node:http2";

import { connectNodeAdapter } from "@connectrpc/connect-node";

import { businessFixture, themeStoreFixture } from "../business/fixture.test";
import type { Display } from "../overlay";
import type { Input } from "../input";
import type { Overlay } from "../overlay";
import { RavenControl, type ClientToServer, type ServerToClient } from "../gen/raven/control/v1/control_pb";
import { newOutbox } from "../../server/transport/outbox";
import { newControl, type Options } from "./index";

/** A no-op Input with call counters, so tests can assert the keyboard was grabbed/released. */
export function newInputSpy(overrides: Partial<Input> = {}) {
	let startCalls = 0;
	let stopCalls = 0;
	const base: Input = {
		Start: () => {
			startCalls++;
			return { bare: 0, control: 0, failed: [] };
		},
		Stop: () => {
			stopCalls++;
		},
		isClickThrough: () => true,
	};
	return {
		...base,
		...overrides,
		get startCalls() { return startCalls; },
		get stopCalls() { return stopCalls; },
	};
}

/** A no-op Overlay, enough to satisfy control's Options without opening real windows. */
export function newOverlaySpy(overrides: Partial<Overlay> = {}) {
	const calls = {
		bursts: [] as Array<{ displayId: number; burst: unknown }>,
		themes: [] as unknown[],
		pushedAssets: [] as unknown[],
	};
	const base: Overlay = {
		OpenOverlays: () => {},
		GetTargetUnderCursor: () => null,
		SendBurst: (displayId, burst) => {
			calls.bursts.push({ displayId, burst });
		},
		BroadcastTheme: (theme) => {
			calls.themes.push(theme);
		},
		SendThemeAssets: (payload) => {
			calls.pushedAssets.push(payload);
		},
		SetClickThrough: () => {},
		Close: () => {},
	};
	return { ...base, ...overrides, calls };
}

function screenStub(displays: Display[] = []) {
	return {
		getAllDisplays: () => displays,
		getCursorScreenPoint: () => ({ x: 0, y: 0 }),
	};
}

/**
 * A control wired entirely with fixtures. `controlUrl` points at a port nothing listens
 * on, on purpose: these tests exercise passivity and command routing, never a real
 * connection, so a real server being up or down must never change their outcome.
 */
export function newTestControl(overrides: Partial<Options> = {}) {
	const opts: Options = {
		controlUrl: "http://127.0.0.1:1",
		version: "0.0.0-test",
		business: businessFixture().business,
		input: newInputSpy(),
		overlay: newOverlaySpy(),
		themes: themeStoreFixture().store,
		screen: screenStub(),
		...overrides,
	};
	return newControl(opts);
}

/** Lets a microtask/timer-driven effect (like the first dial attempt failing) settle. */
export async function flush(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * A real, minimal RavenControl server, for the handful of tests that need an actual
 * connect/disconnect/reconnect cycle rather than a dead port - proving the dead-man's
 * switch and the reconnect re-announce needs a connection that can genuinely succeed, then
 * be dropped, on command. Mirrors server/transport/control.ts's own outbox-per-stream
 * shape (reusing its `newOutbox`) rather than reinventing it.
 */
export function newFakeControlServer() {
	const received: ClientToServer[] = [];
	let outbox: ReturnType<typeof newOutbox<ServerToClient>> | null = null;

	const service = {
		async *connect(reqs: AsyncIterable<ClientToServer>) {
			const box = newOutbox<ServerToClient>();
			outbox = box;
			// Deliberately not `await`ed, unlike server/transport/control.ts's own pump: that
			// real server waits for `reqs` to drain before returning because it still needs
			// onDisconnect timing. This fake has no such need, and awaiting it here would
			// deadlock dropConnection() - closing `box` ends `yield*` below, but `reqs` (the
			// client's still-open outbound stream) only ends when the client itself closes it,
			// which happens on ITS next reconnect attempt, after seeing this stream end. Two
			// sides each waiting on the other never resolves.
			void (async () => {
				for await (const req of reqs) received.push(req);
			})();
			try {
				yield* box;
			} finally {
				if (outbox === box) outbox = null;
			}
		},
	};

	const server = createH2Server(
		connectNodeAdapter({ routes: (router) => router.service(RavenControl, service) }),
	);

	return {
		received,
		/** Resolves once listening, with the OS-assigned port. */
		listen: (): Promise<number> =>
			new Promise((resolve) => {
				server.listen(0, () => {
					const addr = server.address();
					resolve(typeof addr === "object" && addr ? addr.port : 0);
				});
			}),
		close: (): Promise<void> => new Promise((resolve) => server.close(() => resolve())),
		/** Pushes a message to whichever client is currently connected, if any. */
		send: (msg: ServerToClient): void => outbox?.push(msg),
		/** Ends the current stream from the server side, simulating a dropped connection. */
		dropConnection: (): void => outbox?.close(),
	};
}
