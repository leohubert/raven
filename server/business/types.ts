import type { ClientInfo, ServerToClient } from "../../src/gen/raven/control/v1/control_pb";
import type { Theme } from "../../src/themes";

/** How the pool pushes to one client. The transport supplies it; tests supply a fake. */
export type ClientSink = (msg: ServerToClient) => void;

export type PoolEntry = {
	info: ClientInfo;
	send: ClientSink;
	/** Commands sent but not yet acked, so the roster can distinguish intent from reality. */
	pending: Set<string>;
	lastSeen: Date;
};

export type State = { clients: Map<string, PoolEntry> };

/** Fired on every pool mutation, so a transport can push a fresh roster to watchers. */
export type RosterListener = (roster: ClientInfo[]) => void;

/**
 * What SendCommand can ask a client to do. A local, unbranded shape (not the generated
 * wire CommandRequest) because SendCommand is business logic, not a transport - it mints
 * its own commandId rather than trusting one handed in from outside.
 */
export type CommandAction =
	| { case: "activate"; theme: string }
	| { case: "deactivate" }
	| { case: "play"; theme: string; rel: string }
	| { case: "burst"; character: string }
	/** Already read off disk by PushTheme: the pool never touches the filesystem. */
	| { case: "push"; theme: Theme; assets: PushableAsset[] };

/** One theme file on its way to a client that does not have it. */
export type PushableAsset = { rel: string; mime: string; bytes: Uint8Array };

export type CommandRequest = { clientId: string; action: CommandAction };

export type CommandResult = { accepted: boolean; error?: string; commandId?: string };
