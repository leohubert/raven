import { create } from "@bufbuild/protobuf";
import {
	AckSchema,
	ClientInfoSchema,
	ClientState,
	ClientToServerSchema,
	HelloSchema,
	PongSchema,
	StateChangedSchema,
} from "../../src/gen/raven/control/v1/control_pb";
import type { CommandAction, PoolEntry } from "./types";

export function helloFor(clientId: string) {
	return create(ClientToServerSchema, {
		msg: {
			case: "hello",
			value: create(HelloSchema, { clientId, hostname: "mac", version: "1.0.0" }),
		},
	});
}

export function stateChanged(state: ClientState, theme: string) {
	return create(ClientToServerSchema, {
		msg: { case: "state", value: create(StateChangedSchema, { state, theme }) },
	});
}

export function pong(nonce = 0n) {
	return create(ClientToServerSchema, {
		msg: { case: "pong", value: create(PongSchema, { nonce }) },
	});
}

export function activate(theme: string): CommandAction {
	return { case: "activate", theme };
}

export function deactivate(): CommandAction {
	return { case: "deactivate" };
}

export function play(theme: string, rel: string): CommandAction {
	return { case: "play", theme, rel };
}

export function burst(character: string): CommandAction {
	return { case: "burst", character };
}

export function ack(commandId: string, ok = true, error = "") {
	return create(ClientToServerSchema, {
		msg: { case: "ack", value: create(AckSchema, { commandId, ok, error }) },
	});
}

/**
 * A raw PoolEntry, for tests that pin behaviour on `pending` - state the pool's public
 * API deliberately never exposes, so it can only be observed by holding a direct
 * reference to the entry the way onClientMessage itself does.
 */
export function entryFixture(overrides: Partial<PoolEntry> = {}): PoolEntry {
	return {
		info: create(ClientInfoSchema, { clientId: "c1", state: ClientState.PASSIVE }),
		send: () => {},
		pending: new Set(),
		lastSeen: new Date(0),
		...overrides,
	};
}
