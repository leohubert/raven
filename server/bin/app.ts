import { bootstrapServer } from "./_bootstrap";

/**
 * The runnable. Two listeners, on purpose: a browser will not speak HTTP/2 to
 * `http://localhost` without TLS, and gRPC bidi streaming requires HTTP/2, so the control
 * stream (h2c) and the admin/dashboard listener (HTTP/1.1, for gRPC-Web) cannot share one
 * port. Both servers are constructed in `_bootstrap.ts`; this file only starts and stops them.
 */
async function main() {
	const { env, controlServer, adminServer, cleanup } = await bootstrapServer();

	controlServer.listen(env.CONTROL_PORT, () => {
		console.log(`[raven-server] ${env.VERSION} control listening on h2c :${env.CONTROL_PORT}`);
	});

	adminServer.listen(env.ADMIN_PORT, () => {
		console.log(`[raven-server] ${env.VERSION} admin listening on http/1.1 :${env.ADMIN_PORT}`);
	});

	const shutdown = () => {
		cleanup();
		process.exit(0);
	};
	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}

main().catch((err: unknown) => {
	console.error("[raven-server] failed to start:", err);
	process.exit(1);
});
