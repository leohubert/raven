import { create } from "@bufbuild/protobuf";

import { newContext, type Business } from "../business";
import type { Input } from "../input";
import type { Overlay } from "../overlay";
import type { ThemeStore } from "../themes";
import { newThemeReceiver } from "./receiveTheme";
import {
	AckSchema,
	ClientState,
	ClientToServerSchema,
	PongSchema,
	StateChangedSchema,
	type ClientToServer,
	type ServerToClient,
} from "../gen/raven/control/v1/control_pb";

export type Options = { business: Business; overlay: Overlay; input: Input; themes: ThemeStore };

/**
 * Bridges a synchronous producer (`send`/`ack`, called whenever onCommand likes) to the
 * async iterable `client.connect()` consumes on the wire. Mirrors the server's own outbox
 * (server/transport/outbox.ts) for the same reason: a buffer alone drops the wakeup for a
 * parked consumer, and a resolver alone drops a message sent before anyone awaits it.
 */
function newOutbound() {
	const buffer: ClientToServer[] = [];
	let pendingResolve: ((result: IteratorResult<ClientToServer>) => void) | null = null;

	function push(msg: ClientToServer): void {
		if (pendingResolve) {
			const resolve = pendingResolve;
			pendingResolve = null;
			resolve({ value: msg, done: false });
			return;
		}
		buffer.push(msg);
	}

	// Ends whatever is currently awaiting `next()` - a connect-node consumer parked here
	// because the queue was empty - with a clean `done: true` rather than abandoning the
	// promise. Without this, a consumer left parked across a reconnect (or a Stop()) is
	// stranded forever: nulling `pendingResolve` without resolving it, as the previous
	// version of this file did, never wakes it up.
	function close(): void {
		if (pendingResolve) {
			const resolve = pendingResolve;
			pendingResolve = null;
			resolve({ value: undefined, done: true });
		}
	}

	// Drops anything queued but never sent by a failed connection attempt, so a
	// reconnect's fresh Hello never sits behind a stale one from the attempt before it.
	// Call `close()` first - this alone does not wake a parked consumer.
	function reset(): void {
		buffer.length = 0;
		pendingResolve = null;
	}

	const iterable: AsyncIterable<ClientToServer> = {
		[Symbol.asyncIterator]() {
			return {
				next(): Promise<IteratorResult<ClientToServer>> {
					if (buffer.length > 0) {
						return Promise.resolve({ value: buffer.shift() as ClientToServer, done: false });
					}
					return new Promise((resolve) => {
						pendingResolve = resolve;
					});
				},
				// connect-node's gRPC transport pipes this request iterable with
				// `{ propagateDownStreamError: true }` unconditionally (protocol/async-
				// iterable.js's makeIterableAbortable), which requires `throw` to exist and
				// throws synchronously at pipe-setup time otherwise. Verified live: every
				// real connection failed immediately with "AsyncIterable does not implement
				// throw" until this was added - a refused connection never reaches that code
				// path, which is how the earlier version shipped with this undetected.
				throw(error: unknown): Promise<IteratorResult<ClientToServer>> {
					return Promise.reject(error);
				},
				return(value?: unknown): Promise<IteratorResult<ClientToServer>> {
					return Promise.resolve({ value: value as ClientToServer, done: true });
				},
			};
		},
	};

	return { push, close, reset, iterable };
}

/** The command router: every ServerToClient arrives here and is answered with an Ack. */
export function newOnCommand(opts: Options) {
	const outbound = newOutbound();
	const receiver = newThemeReceiver();
	// The only mutable state this module owns. Guards against a second Activate re-running
	// input.Start() while already active (harmless on its own - Stop() unregisters
	// unconditionally either way - but re-registering the same physical keys the process
	// already holds is untested territory, so don't do it), and is what makes isActive()
	// honest instead of the hardcoded stub it used to be.
	//
	// Both variables outlive any single connection - they live here, not inside index.ts's
	// dial(), specifically so a dropped stream does not itself change what the keyboard is
	// doing. A reconnect must re-announce this state (reannounceIfActive) rather than reset
	// it, or the server's belief flips to PASSIVE on every blip while the keyboard stays
	// grabbed - the exact bug this pair of functions exists to prevent.
	let active = false;
	let activeTheme = "";

	function send(msg: ClientToServer): void {
		outbound.push(msg);
	}

	function ack(commandId: string, ok: boolean, error?: string): void {
		send(
			create(ClientToServerSchema, {
				msg: { case: "ack", value: create(AckSchema, { commandId, ok, error: error ?? "" }) },
			}),
		);
	}

	function stateChanged(state: ClientState, theme: string): ClientToServer {
		return create(ClientToServerSchema, {
			msg: { case: "state", value: create(StateChangedSchema, { state, theme }) },
		});
	}

	/** Shared by Deactivate and the dead-man's switch - both must fully release the keyboard. */
	function releaseKeyboard(): void {
		opts.input.Stop();
		active = false;
		activeTheme = "";
	}

	async function onCommand(msg: ServerToClient): Promise<void> {
		switch (msg.msg.case) {
			case "ping":
				send(
					create(ClientToServerSchema, {
						msg: { case: "pong", value: create(PongSchema, { nonce: msg.msg.value.nonce }) },
					}),
				);
				return;
			case "activate": {
				const { commandId, theme: requestedTheme } = msg.msg.value;
				// Load (and only then broadcast/grab) before touching the keyboard: if this
				// throws - e.g. no themes at all - input.Start() must never have run.
				const theme = await opts.business
					.loadTheme(newContext(), { name: requestedTheme })
					.catch((error: unknown) => {
						ack(commandId, false, `could not load theme: ${String(error)}`);
						return null;
					});
				if (!theme) return;

				opts.overlay.BroadcastTheme(theme);

				if (!active) {
					let result: { bare: number; control: number; failed: string[] };
					try {
						result = opts.input.Start();
					} catch (error) {
						// Start() registers hotkeys one at a time; if it throws partway
						// through, some may already be grabbed. Stop() unregisters
						// everything unconditionally, so it is the only way to guarantee
						// nothing is left holding the keyboard.
						opts.input.Stop();
						ack(commandId, false, `could not grab keyboard: ${String(error)}`);
						return;
					}
					const { bare, control, failed } = result;
					if (failed.length > 0) {
						// RegisterEventHotKey refuses a combination another app already holds. Say so.
						console.warn(`[raven] could not grab ${failed.length}: ${failed.join(" ")}`);
					}
					console.log(
						`[raven] active - theme "${theme.name}", ${bare} keys grabbed, ${control} hotkeys`,
					);
					active = true;
				}

				// Set even when already active, so a theme switch while active is remembered
				// too - reannounceIfActive() must report whatever theme is actually running.
				activeTheme = theme.name;
				send(stateChanged(ClientState.ACTIVE, theme.name));
				ack(commandId, true);
				return;
			}
			case "deactivate": {
				const { commandId } = msg.msg.value;
				releaseKeyboard();
				send(stateChanged(ClientState.PASSIVE, ""));
				ack(commandId, true);
				return;
			}
			case "play": {
				const { commandId, theme, rel } = msg.msg.value;
				const target = opts.overlay.GetTargetUnderCursor();
				if (!target) {
					ack(commandId, false, "no display under cursor");
					return;
				}
				const burst = await opts.business.playAsset(newContext(), {
					theme,
					rel,
					position: target.position,
					scaleFactor: target.scaleFactor,
				});
				if (burst) opts.overlay.SendBurst(target.displayId, burst);
				ack(commandId, burst !== null, burst ? "" : "asset not found");
				return;
			}
			case "burst": {
				const { commandId, character } = msg.msg.value;
				const target = opts.overlay.GetTargetUnderCursor();
				if (!target) {
					ack(commandId, false, "no display under cursor");
					return;
				}
				const burst = opts.business.onKeyPressed(newContext(), {
					char: character,
					position: target.position,
					scaleFactor: target.scaleFactor,
				});
				if (burst) opts.overlay.SendBurst(target.displayId, burst);
				ack(commandId, burst !== null);
				return;
			}
			case "push": {
				const { commandId } = msg.msg.value;
				const outcome = receiver.onChunk(msg.msg.value);
				if (outcome.case === "pending" || outcome.case === "discarded") return;
				if (outcome.case === "rejected") {
					ack(commandId, false, outcome.error);
					return;
				}
				// Registered in the theme store rather than handed straight to the overlay: a
				// pushed theme has to answer to its own name for the Activate that follows it,
				// and this client's disk will never have it.
				opts.themes.UpsertPushedTheme(outcome.value.theme);
				opts.overlay.SendThemeAssets({
					theme: outcome.value.theme.name,
					assets: outcome.value.assets,
				});
				ack(commandId, true);
				return;
			}
			default:
				return;
		}
	}

	return {
		onCommand,
		send,
		outbound: outbound.iterable,
		closeOutbound: outbound.close,
		resetOutbound: outbound.reset,
		isActive: (): boolean => active,
		/**
		 * Called by index.ts right after a fresh Hello, on every (re)connect. The server
		 * rebuilds its roster entry as PASSIVE for every new stream (it has no other way to
		 * know), so a reconnect while genuinely active must re-assert that immediately, or
		 * the roster lies - ACTIVE and grabbed on this machine, PASSIVE on the dashboard -
		 * for as long as the connection stays up. A no-op while passive.
		 */
		reannounceIfActive: (): void => {
			if (active) send(stateChanged(ClientState.ACTIVE, activeTheme));
		},
		/**
		 * The dead-man's switch's payload: release the keyboard unconditionally, with no
		 * commandId to ack and no live connection to report over (index.ts only calls this
		 * once contact with the server has been lost long enough to give up). Reuses
		 * releaseKeyboard() so this is the exact same cleanup Deactivate performs.
		 */
		forceDeactivate: (): void => {
			releaseKeyboard();
		},
	};
}
