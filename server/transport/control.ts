import type { ClientToServer, ServerToClient } from "../../src/gen/raven/control/v1/control_pb";
import { newOutbox } from "./outbox";
import type { Options } from "./options";

/**
 * The Connect-ES bidi handler. Each stream is one client, registered with the pool under
 * a server-minted id for the stream's whole lifetime - stable client identity across
 * restarts is out of scope for this milestone, so there is no reason to key off `Hello`.
 *
 * The inbound pump and the outbound `yield*` are two independent loops that must both
 * terminate no matter which side ends first: a client hangup ends `reqs`, which ends the
 * pump, which closes the outbox, which ends `yield*`. A server-initiated end (pool drops
 * the client) closes the outbox directly, which ends `yield*`, whose `finally` then waits
 * for the pump to drain and calls `onDisconnect`. Either path calls `onDisconnect` exactly
 * once, from the pump's own `finally`.
 */
export function newControlService(opts: Options) {
	return {
		async *connect(reqs: AsyncIterable<ClientToServer>) {
			const outbox = newOutbox<ServerToClient>();
			const id = crypto.randomUUID();
			opts.pool.onConnect(id, (msg) => outbox.push(msg));
			console.log(`[raven-server] client connected: ${id} (${opts.pool.ListClients().length} online)`);

			const pump = (async () => {
				try {
					for await (const req of reqs) opts.pool.onClientMessage(id, req);
				} finally {
					opts.pool.onDisconnect(id);
					outbox.close();
					console.log(
						`[raven-server] client disconnected: ${id} (${opts.pool.ListClients().length} online)`,
					);
				}
			})();

			try {
				yield* outbox;
			} finally {
				await pump;
			}
		},
	};
}
