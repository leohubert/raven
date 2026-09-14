import { useEffect, useState } from "react";
import { create } from "@bufbuild/protobuf";
import {
	ListPushableThemesRequestSchema,
	WatchClientsRequestSchema,
	type ClientInfo,
} from "../../src/gen/raven/control/v1/control_pb";
import { ravenAdminClient, type RavenAdminClient } from "./actions";
import { describeError } from "./describeError";

const MIN_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 15_000;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve) => {
		const timer = setTimeout(resolve, ms);
		signal.addEventListener("abort", () => {
			clearTimeout(timer);
			resolve();
		});
	});
}

export type ConnectionState = "connecting" | "live" | "disconnected";

export type RosterState = {
	clients: ClientInfo[];
	connectionState: ConnectionState;
	statusMessage: string;
	themes: string[];
	themesError: string | null;
};

/**
 * Owns the dashboard's two RPCs so `App` only ever sees state, never transport. `WatchClients`
 * is a live gRPC-Web stream, not a one-shot fetch: a server restart, a dropped connection, or a
 * proxy hiccup ends the `for await` loop rather than throwing cleanly every time. Without a
 * retry, the page would go quietly stale - showing whatever roster it last saw with no
 * indication it is no longer live - so this reconnects forever with backoff until the effect is
 * torn down, at which point the abort signal both stops the loop and cancels any in-flight call.
 *
 * `client` defaults to the app's shared `ravenAdminClient` (see actions.ts); tests inject a
 * fake so the retry/backoff behaviour above can be exercised without a network.
 */
export function useRoster(client: RavenAdminClient = ravenAdminClient): RosterState {
	const [clients, setClients] = useState<ClientInfo[]>([]);
	const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
	const [statusMessage, setStatusMessage] = useState("connecting…");
	const [themes, setThemes] = useState<string[]>([]);
	const [themesError, setThemesError] = useState<string | null>(null);

	useEffect(() => {
		const abort = new AbortController();

		async function loadPushableThemes(): Promise<void> {
			try {
				const result = await client.listPushableThemes(create(ListPushableThemesRequestSchema, {}), {
					signal: abort.signal,
				});
				setThemes(result.themes);
				setThemesError(null);
			} catch (err) {
				if (abort.signal.aborted) return;
				setThemesError(`Could not load pushable themes: ${describeError(err)}`);
			}
		}

		async function watchRoster(): Promise<void> {
			let backoff = MIN_BACKOFF_MS;
			while (!abort.signal.aborted) {
				try {
					const stream = client.watchClients(create(WatchClientsRequestSchema, {}), { signal: abort.signal });
					for await (const roster of stream) {
						backoff = MIN_BACKOFF_MS;
						setConnectionState("live");
						setStatusMessage("live");
						setClients(roster.clients);
					}
				} catch (err) {
					if (!abort.signal.aborted) console.error("[raven-dashboard] watchClients error:", err);
				}
				if (abort.signal.aborted) return;
				setConnectionState("disconnected");
				setStatusMessage(`disconnected, retrying in ${Math.round(backoff / 1000)}s`);
				await sleep(backoff, abort.signal);
				backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
			}
		}

		void loadPushableThemes();
		void watchRoster();

		return () => abort.abort();
	}, [client]);

	return { clients, connectionState, statusMessage, themes, themesError };
}
