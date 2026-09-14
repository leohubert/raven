import { create } from "@bufbuild/protobuf";
import type { HandlerContext } from "@connectrpc/connect";
import type { ThemeStore } from "../../src/themes";
import { PushTheme, type CommandAction, type CommandResult as PoolCommandResult, type Pool } from "../business";
import {
	CommandResultSchema,
	RosterSchema,
	ThemeListSchema,
	type ClientInfo,
	type CommandRequest,
	type CommandResult,
	type ListPushableThemesRequest,
	type Roster,
	type ThemeList,
	type WatchClientsRequest,
} from "../../src/gen/raven/control/v1/control_pb";
import { newOutbox } from "./outbox";

export type Options = { pool: Pool; themes: ThemeStore };

/**
 * Maps the wire `CommandRequest.action` to the pool's local `CommandAction`. `push` is
 * absent on purpose: it needs the theme read off disk first, so `sendCommand` hands it to
 * `PushTheme` before it ever reaches here.
 */
function toCommandAction(req: CommandRequest): CommandAction | null {
	switch (req.action.case) {
		case "activate":
			return { case: "activate", theme: req.action.value.theme };
		case "deactivate":
			return { case: "deactivate" };
		case "play":
			return { case: "play", theme: req.action.value.theme, rel: req.action.value.rel };
		case "burst":
			return { case: "burst", character: req.action.value.character };
		case "push":
		case undefined:
			return null;
	}
}

function sendAction(pool: Pool, req: CommandRequest): PoolCommandResult {
	const action = toCommandAction(req);
	if (!action) return { accepted: false, error: "no action supplied" };
	return pool.SendCommand({ clientId: req.clientId, action });
}

/**
 * `RavenAdmin`: the gRPC-Web-reachable half of the server. Unary and server-streaming
 * only, since a browser dashboard cannot open the bidi stream `RavenControl` uses.
 */
export function newAdminService(opts: Options) {
	return {
		async *watchClients(_req: WatchClientsRequest, context: HandlerContext) {
			const outbox = newOutbox<Roster>();
			const toRoster = (clients: ClientInfo[]) => create(RosterSchema, { clients });

			outbox.push(toRoster(opts.pool.ListClients()));
			const unsubscribe = opts.pool.WatchRoster((clients) => outbox.push(toRoster(clients)));

			// Only closing here, not unsubscribing here too - unsubscribe happens once, in
			// the `finally` below, however the stream ends (abort or otherwise).
			const onAbort = () => outbox.close();
			context.signal.addEventListener("abort", onAbort);

			try {
				yield* outbox;
			} finally {
				context.signal.removeEventListener("abort", onAbort);
				unsubscribe();
			}
		},

		async sendCommand(req: CommandRequest): Promise<CommandResult> {
			// The wire request's own commandId (if any) is dropped on every path below: only
			// the pool mints commandIds, since an admin must never be able to supply one that
			// collides with or spoofs a client's ack.
			const result =
				req.action.case === "push"
					? await PushTheme(opts, { clientId: req.clientId, theme: req.action.value.theme })
					: sendAction(opts.pool, req);

			return create(CommandResultSchema, {
				accepted: result.accepted,
				error: result.error ?? "",
				commandId: result.commandId ?? "",
			});
		},

		async listPushableThemes(_req: ListPushableThemesRequest): Promise<ThemeList> {
			return create(ThemeListSchema, { themes: await opts.themes.ListThemes() });
		},
	};
}
