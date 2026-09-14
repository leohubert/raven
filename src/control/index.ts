import { hostname } from "node:os";

import { create } from "@bufbuild/protobuf";
import { createClient } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";

import {
	ClientToServerSchema,
	DisplaySchema,
	HelloSchema,
	RavenControl,
} from "../gen/raven/control/v1/control_pb";
import { newIdentity } from "./identity";
import { newOnCommand } from "./onCommand";
import type { Options } from "./options";

export type { Options } from "./options";

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
const DEFAULT_DEAD_MANS_SWITCH_MS = 60_000;

/**
 * The control transport: dials the server, sends Hello, then reacts to whatever it is
 * told. Sits dormant until the server sends Activate - `input.Start()` has no other call
 * site - which is what keeps a downed or hostile server from ever touching the keyboard
 * of the machine raven runs on.
 *
 * A server that is down must never take the client with it: every failure path here
 * logs and reconnects with exponential backoff (capped at `MAX_BACKOFF_MS`); nothing
 * thrown by the stream escapes this function.
 *
 * Losing the stream is not the same as being told to deactivate, and must not be treated
 * as one: `active` lives in onCommand's closure, not here, so it (and the real hotkey
 * registrations) survive a reconnect untouched. Two things then have to happen around
 * every reconnect, for different reasons - see the dead-man's switch below for why a
 * re-announce alone is not enough.
 */
export function newControl(opts: Options) {
	const identity = newIdentity();
	const { onCommand, send, outbound, closeOutbound, resetOutbound, isActive, reannounceIfActive, forceDeactivate } =
		newOnCommand({
			business: opts.business,
			overlay: opts.overlay,
			input: opts.input,
		});
	const deadMansSwitchMs = opts.deadMansSwitchMs ?? DEFAULT_DEAD_MANS_SWITCH_MS;

	let stopped = true;
	let retryTimer: ReturnType<typeof setTimeout> | null = null;
	// Scoped to the current dial attempt so Stop() can cancel the live HTTP/2 stream
	// instead of merely stopping future reconnects - connect-node's response iterable
	// deliberately omits throw/return (it says so in its own source), so exiting the
	// `for await` below with a bare `return` sends the transport no cancellation at all.
	let abortController: AbortController | null = null;
	// Armed the moment an active connection is lost, disarmed the moment it is regained.
	// If it ever fires, contact with the server has been gone for `deadMansSwitchMs` while
	// this client was ACTIVE - a re-announce on reconnect fixes the roster lying during an
	// ordinary blip, but does nothing if the server never comes back, and dial() retries
	// forever. Without this, that leaves the keyboard grabbed with no way for anyone to
	// send Deactivate - the single worst outcome this project exists to prevent.
	let deadMansSwitch: ReturnType<typeof setTimeout> | null = null;

	function armDeadMansSwitch(): void {
		if (deadMansSwitch || !isActive()) return;
		deadMansSwitch = setTimeout(() => {
			deadMansSwitch = null;
			console.warn(
				`[raven-control] lost contact with the server for ${deadMansSwitchMs}ms while active - releasing the keyboard`,
			);
			forceDeactivate();
		}, deadMansSwitchMs);
		deadMansSwitch.unref();
	}

	function disarmDeadMansSwitch(): void {
		if (!deadMansSwitch) return;
		clearTimeout(deadMansSwitch);
		deadMansSwitch = null;
	}

	async function buildHello() {
		return create(HelloSchema, {
			clientId: identity.clientId,
			hostname: hostname(),
			version: opts.version,
			displays: opts.screen.getAllDisplays().map((d) =>
				create(DisplaySchema, {
					id: d.id,
					width: d.bounds.width,
					height: d.bounds.height,
					scaleFactor: d.scaleFactor,
				}),
			),
			themes: await opts.themes.ListThemes(),
		});
	}

	async function dial(backoffMs: number): Promise<void> {
		if (stopped) return;
		// A parked consumer from the previous attempt (or none) must be woken with a clean
		// end before the queue is emptied for reuse - see onCommand.ts's close()/reset().
		closeOutbound();
		resetOutbound();
		abortController = new AbortController();

		try {
			const client = createClient(RavenControl, createGrpcTransport({ baseUrl: opts.controlUrl }));
			send(create(ClientToServerSchema, { msg: { case: "hello", value: await buildHello() } }));
			// The server rebuilds its roster entry as PASSIVE for every new stream - it has no
			// other way to know otherwise - so a reconnect while genuinely active must correct
			// that immediately, or the roster keeps lying for as long as the new connection
			// stays up. No-op while passive.
			reannounceIfActive();

			let established = false;
			for await (const msg of client.connect(outbound, { signal: abortController.signal })) {
				if (stopped) return;
				if (!established) {
					// A successful `createClient` call proves nothing; reading the first real
					// message is the honest signal that the connection is actually up, so
					// only then does a later drop deserve to start backing off from scratch -
					// and only then has contact with the server truly been regained.
					established = true;
					backoffMs = INITIAL_BACKOFF_MS;
					disarmDeadMansSwitch();
				}
				await onCommand(msg);
			}
		} catch (error) {
			console.error(`[raven-control] connection error: ${String(error)}`);
		}

		if (stopped) return;
		armDeadMansSwitch();
		console.log(`[raven-control] disconnected, reconnecting in ${backoffMs}ms`);
		retryTimer = setTimeout(() => void dial(Math.min(backoffMs * 2, MAX_BACKOFF_MS)), backoffMs);
		retryTimer.unref();
	}

	return {
		/** Dials and greets, but registers no hotkey - only a future Activate does that. */
		Start: (): void => {
			stopped = false;
			void dial(INITIAL_BACKOFF_MS);
		},
		Stop: (): void => {
			stopped = true;
			if (retryTimer) clearTimeout(retryTimer);
			disarmDeadMansSwitch();
			abortController?.abort();
			closeOutbound();
		},
		onCommand,
		isActive,
	};
}

export type Control = ReturnType<typeof newControl>;
