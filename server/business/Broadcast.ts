import type { ServerToClient } from "../../src/gen/raven/control/v1/control_pb";
import type { Deps } from "./deps";

export function Broadcast(deps: Deps, msg: ServerToClient): void {
	for (const entry of deps.state.clients.values()) entry.send(msg);
}
