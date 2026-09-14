import type { ClientInfo } from "../../src/gen/raven/control/v1/control_pb";
import type { Deps } from "./deps";

export function GetClient(deps: Deps, clientId: string): ClientInfo | null {
	return deps.state.clients.get(clientId)?.info ?? null;
}
