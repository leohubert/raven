import type { Deps } from "./deps";
import { notifyRoster } from "./WatchRoster";

export function onDisconnect(deps: Deps, clientId: string): void {
	deps.state.clients.delete(clientId);
	notifyRoster(deps);
}
