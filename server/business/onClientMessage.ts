import type { ClientToServer } from "../../src/gen/raven/control/v1/control_pb";
import type { Deps } from "./deps";
import { notifyRoster } from "./WatchRoster";

export function onClientMessage(deps: Deps, clientId: string, msg: ClientToServer): void {
	const entry = deps.state.clients.get(clientId);
	if (!entry) return;

	switch (msg.msg.case) {
		case "hello":
			entry.info.hostname = msg.msg.value.hostname;
			entry.info.version = msg.msg.value.version;
			entry.info.displays = msg.msg.value.displays;
			entry.info.themes = msg.msg.value.themes;
			break;
		case "state":
			entry.info.state = msg.msg.value.state;
			entry.info.theme = msg.msg.value.theme;
			break;
		case "ack":
			entry.pending.delete(msg.msg.value.commandId);
			break;
		case "pong":
			entry.lastSeen = deps.now();
			break;
		default:
			// "themes" carries nothing this pool tracks; an empty frame is a no-op.
			return;
	}

	notifyRoster(deps);
}
