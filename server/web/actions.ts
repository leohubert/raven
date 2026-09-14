import { create } from "@bufbuild/protobuf";
import { createClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import {
	ActivateSchema,
	BurstKeySchema,
	DeactivateSchema,
	PlaySoundSchema,
	PushThemeSchema,
	RavenAdmin,
	type CommandRequest,
} from "../../src/gen/raven/control/v1/control_pb";

// Shared by every panel's action controls and by useRoster's roster stream (injected there as
// a default parameter) - one client instance, so an interceptor or auth header added here
// reaches both call sites instead of silently missing one of them.
export const ravenAdminClient = createClient(RavenAdmin, createGrpcWebTransport({ baseUrl: window.location.origin }));
export type RavenAdminClient = typeof ravenAdminClient;

export function activateAction(theme: string): CommandRequest["action"] {
	return { case: "activate", value: create(ActivateSchema, { theme }) };
}

export function deactivateAction(): CommandRequest["action"] {
	return { case: "deactivate", value: create(DeactivateSchema, {}) };
}

export function playAction(theme: string, rel: string): CommandRequest["action"] {
	return { case: "play", value: create(PlaySoundSchema, { theme, rel }) };
}

export function burstAction(character: string): CommandRequest["action"] {
	return { case: "burst", value: create(BurstKeySchema, { character }) };
}

export function pushAction(theme: string): CommandRequest["action"] {
	return { case: "push", value: create(PushThemeSchema, { theme }) };
}
