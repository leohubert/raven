import { create } from "@bufbuild/protobuf";
import { ClientInfoSchema, ClientState } from "../../src/gen/raven/control/v1/control_pb";
import type { Deps } from "./deps";
import { notifyRoster } from "./WatchRoster";
import type { ClientSink } from "./types";

export function onConnect(deps: Deps, clientId: string, sink: ClientSink): void {
	deps.state.clients.set(clientId, {
		info: create(ClientInfoSchema, {
			clientId,
			state: ClientState.PASSIVE,
			connectedAtUnixMs: BigInt(deps.now().getTime()),
		}),
		send: sink,
		pending: new Set(),
		lastSeen: deps.now(),
	});
	notifyRoster(deps);
}
