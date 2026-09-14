import { create } from "@bufbuild/protobuf";
import {
	ActivateSchema,
	BurstKeySchema,
	DeactivateSchema,
	PlaySoundSchema,
	PushThemeChunkSchema,
	ServerToClientSchema,
	type ServerToClient,
} from "../../src/gen/raven/control/v1/control_pb";
import type { Theme } from "../../src/themes";
import type { Deps } from "./deps";
import type { CommandAction, CommandRequest, CommandResult, PushableAsset } from "./types";

/**
 * A push is the one command that is not a single message: the manifest leads, one chunk per
 * file follows, and all of them carry the same commandId - the client assembles the theme
 * and acks once, when `total` chunks have arrived.
 */
function toPushChunks(commandId: string, theme: Theme, assets: PushableAsset[]): ServerToClient[] {
	const total = assets.length + 1;
	const chunk = (fields: { seq: number; manifest?: string; rel?: string; mime?: string; data?: Uint8Array }) =>
		create(ServerToClientSchema, {
			msg: {
				case: "push",
				value: create(PushThemeChunkSchema, { commandId, theme: theme.name, total, ...fields }),
			},
		});

	return [
		chunk({ seq: 0, manifest: JSON.stringify(theme) }),
		...assets.map(({ rel, mime, bytes }, index) => chunk({ seq: index + 1, rel, mime, data: bytes })),
	];
}

function toServerToClient(commandId: string, action: CommandAction): ServerToClient[] {
	switch (action.case) {
		case "activate":
			return [
				create(ServerToClientSchema, {
					msg: { case: "activate", value: create(ActivateSchema, { commandId, theme: action.theme }) },
				}),
			];
		case "deactivate":
			return [
				create(ServerToClientSchema, {
					msg: { case: "deactivate", value: create(DeactivateSchema, { commandId }) },
				}),
			];
		case "play":
			return [
				create(ServerToClientSchema, {
					msg: {
						case: "play",
						value: create(PlaySoundSchema, { commandId, theme: action.theme, rel: action.rel }),
					},
				}),
			];
		case "burst":
			return [
				create(ServerToClientSchema, {
					msg: { case: "burst", value: create(BurstKeySchema, { commandId, character: action.character }) },
				}),
			];
		case "push":
			return toPushChunks(commandId, action.theme, action.assets);
	}
}

export function SendCommand(deps: Deps, req: CommandRequest): CommandResult {
	const entry = deps.state.clients.get(req.clientId);
	if (!entry) return { accepted: false, error: `unknown client: ${req.clientId}` };

	const commandId = crypto.randomUUID();
	entry.pending.add(commandId);
	for (const msg of toServerToClient(commandId, req.action)) entry.send(msg);
	return { accepted: true, commandId };
}
