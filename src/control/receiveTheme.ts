import { posix } from "node:path";

import type { PushThemeChunk } from "../gen/raven/control/v1/control_pb";
import type { PushedAsset } from "../overlay";
import type { Theme } from "../themes";

export type ReceivedTheme = { theme: Theme; assets: PushedAsset[] };

export type ChunkOutcome =
	| { case: "pending" }
	| { case: "ready"; value: ReceivedTheme }
	| { case: "rejected"; error: string }
	/** A chunk of a push that was already refused: say nothing, it has been reported once. */
	| { case: "discarded" };

/**
 * A pushed path must stay inside the themes tree. Nothing is written to disk today - the
 * assets only ever become blob URLs - but disk persistence is the obvious next step, and a
 * traversal bug introduced now would ship silently with it.
 */
export function sanitizeRel(rel: string): string | null {
	if (rel.length === 0 || rel.startsWith("/")) return null;
	const segments = posix.normalize(rel).split("/");
	if (segments.some((segment) => segment === ".." || segment === "")) return null;
	return segments.join("/");
}

type InFlight = { theme: Theme | null; assets: PushedAsset[]; received: number; poisoned: boolean };

/**
 * Reassembles the chunks of one push (server/business/PushTheme.ts) into a whole theme.
 *
 * Keyed by commandId rather than by theme name: two pushes can be in flight at once, and
 * merging their chunks would produce a theme whose files came from both.
 */
export function newThemeReceiver() {
	const inFlight = new Map<string, InFlight>();

	function reject(commandId: string, error: string): ChunkOutcome {
		const push = inFlight.get(commandId);
		// Kept, marked poisoned: dropping it outright would let the chunks still on the wire
		// start a fresh push that completes as if nothing had been refused.
		if (push) push.poisoned = true;
		return { case: "rejected", error };
	}

	function onChunk(chunk: PushThemeChunk): ChunkOutcome {
		const push = inFlight.get(chunk.commandId) ?? {
			theme: null,
			assets: [],
			received: 0,
			poisoned: false,
		};
		inFlight.set(chunk.commandId, push);
		push.received++;

		if (push.poisoned) {
			if (push.received >= chunk.total) inFlight.delete(chunk.commandId);
			return { case: "discarded" };
		}

		if (chunk.manifest.length > 0) {
			try {
				push.theme = JSON.parse(chunk.manifest) as Theme;
			} catch (error) {
				return reject(chunk.commandId, `unreadable theme manifest: ${String(error)}`);
			}
		} else {
			const rel = sanitizeRel(chunk.rel);
			if (!rel) return reject(chunk.commandId, `refused asset path: ${chunk.rel}`);
			// Electrobun's RPC is JSON-based, so bytes can only reach the webview as text.
			push.assets.push({ rel, mime: chunk.mime, base64: Buffer.from(chunk.data).toString("base64") });
		}

		if (push.received < chunk.total) return { case: "pending" };

		inFlight.delete(chunk.commandId);
		if (!push.theme) return { case: "rejected", error: "push carried no theme manifest" };
		return { case: "ready", value: { theme: push.theme, assets: push.assets } };
	}

	return { onChunk };
}
