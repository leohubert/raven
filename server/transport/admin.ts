import { create } from "@bufbuild/protobuf";
import type { HandlerContext } from "@connectrpc/connect";
import type { ThemeStore } from "../../src/themes";
import type { CommandAction, Pool } from "../business";
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
 * Maps the wire `CommandRequest.action` to the pool's local `CommandAction`. `push` has no
 * local counterpart on purpose - it fans out many `PushThemeChunk` messages (Task 9), which
 * is not a single routable command, so it is refused by the caller before this ever runs.
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
			if (req.action.case === "push") {
				return create(CommandResultSchema, {
					accepted: false,
					error: "push is not a routable command - it fans out over PushThemeChunk instead",
				});
			}

			const action = toCommandAction(req);
			if (!action) {
				return create(CommandResultSchema, { accepted: false, error: "no action supplied" });
			}

			// The wire request's own commandId (if any) is dropped here: only the pool mints
			// commandIds, since an admin must never be able to supply one that collides with
			// or spoofs a client's ack.
			const result = opts.pool.SendCommand({ clientId: req.clientId, action });
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
