import { Broadcast } from "./Broadcast";
import { GetClient } from "./GetClient";
import { ListClients } from "./ListClients";
import { onClientMessage } from "./onClientMessage";
import { onConnect } from "./onConnect";
import { onDisconnect } from "./onDisconnect";
import { PruneStale } from "./PruneStale";
import { SendCommand } from "./SendCommand";
import { WatchRoster } from "./WatchRoster";
import type { Deps } from "./deps";
import type { Options } from "./options";
import type { ClientSink, CommandRequest, CommandResult, RosterListener } from "./types";
import type {
	ClientInfo,
	ClientToServer,
	ServerToClient,
} from "../../src/gen/raven/control/v1/control_pb";

export { PushTheme } from "./PushTheme";
export type { Options } from "./options";
export type {
	ClientSink,
	CommandAction,
	CommandRequest,
	CommandResult,
	PushableAsset,
	RosterListener,
} from "./types";

/**
 * Who is connected to the server and what state they are in. Holds the only mutable
 * runtime state, and knows nothing about gRPC or streams - a connected client is just an
 * injected `send` callback, which is what makes this testable with a fake.
 */
export function newPool(opts: Options) {
	const deps: Deps = { ...opts, state: { clients: new Map() }, listeners: new Set() };

	return {
		onConnect: (id: string, sink: ClientSink): void => onConnect(deps, id, sink),
		onDisconnect: (id: string): void => onDisconnect(deps, id),
		onClientMessage: (id: string, msg: ClientToServer): void => onClientMessage(deps, id, msg),
		ListClients: (): ClientInfo[] => ListClients(deps),
		GetClient: (id: string): ClientInfo | null => GetClient(deps, id),
		SendCommand: (req: CommandRequest): CommandResult => SendCommand(deps, req),
		WatchRoster: (cb: RosterListener): (() => void) => WatchRoster(deps, cb),
		Broadcast: (msg: ServerToClient): void => Broadcast(deps, msg),
		PruneStale: (olderThan: Date): string[] => PruneStale(deps, olderThan),
	};
}

export type Pool = ReturnType<typeof newPool>;
