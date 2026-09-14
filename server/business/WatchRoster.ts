import type { ClientInfo } from "../../src/gen/raven/control/v1/control_pb";
import type { Deps } from "./deps";
import { ListClients } from "./ListClients";
import type { RosterListener } from "./types";

export function WatchRoster(deps: Deps, cb: RosterListener): () => void {
	deps.listeners.add(cb);
	return () => deps.listeners.delete(cb);
}

/** Every pool mutation calls this so watchers always see the current roster. */
export function notifyRoster(deps: Deps): void {
	const roster: ClientInfo[] = ListClients(deps);
	for (const listener of deps.listeners) listener(roster);
}
