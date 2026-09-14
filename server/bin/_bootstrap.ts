import { createServer as createH2Server } from "node:http2";
import { createServer as createHttpServer } from "node:http";
import { create } from "@bufbuild/protobuf";
import { connectNodeAdapter } from "@connectrpc/connect-node";
import { newPool, type Pool } from "../business";
import { newThemeStore, type ThemeStore } from "../../src/themes";
import { newAdminService } from "../transport/admin";
import { newControlService } from "../transport/control";
import { PingSchema, RavenAdmin, RavenControl, ServerToClientSchema } from "../../src/gen/raven/control/v1/control_pb";
import { bundleMain, newDashboardFallback } from "../web/static";
import { loadEnv, type Env } from "./env";

export type { Env } from "./env";

export type Services = {
	pool: Pool;
	themes: ThemeStore;
};

export type BootstrapResult = {
	env: Env;
	services: Services;
	controlServer: ReturnType<typeof createH2Server>;
	adminServer: ReturnType<typeof createHttpServer>;
	cleanup: () => void;
};

const KEEPALIVE_INTERVAL_MS = 15_000;
const STALE_AFTER_MS = 45_000;

/**
 * The single dependency-injection site for the server process. Everything is constructed
 * here and passed down - both listeners included, so `app.ts` only ever calls `.listen()`
 * and `cleanup()` only ever releases what this function opened.
 *
 * Async because the dashboard's bundle is built here, once, before either server starts
 * listening - see `server/web/static.ts` for why start-time bundling was chosen over a
 * separate build step.
 */
export async function bootstrapServer(): Promise<BootstrapResult> {
	const env = loadEnv();
	const pool = newPool({ now: () => new Date() });
	const themes = newThemeStore({
		themesRoot: env.THEMES_ROOT,
		settingsPath: env.SETTINGS_PATH,
		// The client swaps these for blob: URLs once themes are pushed over the wire (Task 9).
		assetBaseUrl: "pushed://",
	});

	const keepalive = setInterval(() => {
		pool.Broadcast(
			create(ServerToClientSchema, {
				msg: { case: "ping", value: create(PingSchema, { nonce: BigInt(Date.now()) }) },
			}),
		);

		// PruneStale never touches the dead stream itself - it only forgets the roster
		// entry - so a vanished client must be logged here or it disappears with no trace.
		const dropped = pool.PruneStale(new Date(Date.now() - STALE_AFTER_MS));
		if (dropped.length > 0) {
			console.log(`[raven-server] pruned stale client(s): ${dropped.join(", ")}`);
		}
	}, KEEPALIVE_INTERVAL_MS);

	const control = newControlService({ pool });
	const controlServer = createH2Server(
		connectNodeAdapter({
			routes: (router) => {
				router.service(RavenControl, control);
			},
		}),
	);

	const admin = newAdminService({ pool, themes });
	const bundleJs = await bundleMain(env.WEB_ROOT);
	const adminServer = createHttpServer(
		connectNodeAdapter({
			routes: (router) => {
				router.service(RavenAdmin, admin);
			},
			// connectNodeAdapter only recognises Connect/gRPC-Web routes; everything else (the
			// dashboard page, its bundle, its stylesheet) falls through to here rather than a
			// separate router or a third port.
			fallback: newDashboardFallback({ webRoot: env.WEB_ROOT, bundleJs }),
		}),
	);

	const cleanup = () => {
		clearInterval(keepalive);
		controlServer.close();
		adminServer.close();
	};

	return { env, services: { pool, themes }, controlServer, adminServer, cleanup };
}
