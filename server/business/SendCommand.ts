import { create } from "@bufbuild/protobuf";
import {
	ActivateSchema,
	BurstKeySchema,
	DeactivateSchema,
	PlaySoundSchema,
	ServerToClientSchema,
	type ServerToClient,
} from "../../src/gen/raven/control/v1/control_pb";
import type { Deps } from "./deps";
import type { CommandAction, CommandRequest, CommandResult } from "./types";

function toServerToClient(commandId: string, action: CommandAction): ServerToClient {
	switch (action.case) {
		case "activate":
			return create(ServerToClientSchema, {
				msg: { case: "activate", value: create(ActivateSchema, { commandId, theme: action.theme }) },
			});
		case "deactivate":
			return create(ServerToClientSchema, {
				msg: { case: "deactivate", value: create(DeactivateSchema, { commandId }) },
			});
		case "play":
			return create(ServerToClientSchema, {
				msg: {
					case: "play",
					value: create(PlaySoundSchema, { commandId, theme: action.theme, rel: action.rel }),
				},
			});
		case "burst":
			return create(ServerToClientSchema, {
				msg: { case: "burst", value: create(BurstKeySchema, { commandId, character: action.character }) },
			});
	}
}

export function SendCommand(deps: Deps, req: CommandRequest): CommandResult {
	const entry = deps.state.clients.get(req.clientId);
	if (!entry) return { accepted: false, error: `unknown client: ${req.clientId}` };

	const commandId = crypto.randomUUID();
	entry.pending.add(commandId);
	entry.send(toServerToClient(commandId, req.action));
	return { accepted: true, commandId };
}
