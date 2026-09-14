import type { ClientInfo } from "../../src/gen/raven/control/v1/control_pb";
import type { Deps } from "./deps";

export function ListClients(deps: Deps): ClientInfo[] {
	return [...deps.state.clients.values()].map((entry) => entry.info);
}
