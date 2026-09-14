import type { Deps } from "./deps";
import { notifyRoster } from "./WatchRoster";

/**
 * Drops clients that have gone quiet since `olderThan`, so a stream that died without a
 * clean disconnect does not linger in the roster forever. Returns the ids it dropped.
 */
export function PruneStale(deps: Deps, olderThan: Date): string[] {
	const dropped: string[] = [];
	for (const [id, entry] of deps.state.clients) {
		if (entry.lastSeen < olderThan) {
			deps.state.clients.delete(id);
			dropped.push(id);
		}
	}
	if (dropped.length > 0) notifyRoster(deps);
	return dropped;
}
