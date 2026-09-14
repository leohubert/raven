import { join } from "node:path";
import { tmpdir } from "node:os";

function getString(key: string, fallback: string): string {
	const value = process.env[key];
	return value && value.length > 0 ? value : fallback;
}

function getNumber(key: string, fallback: number): number {
	const value = process.env[key];
	if (!value) return fallback;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * One loadEnv at the bottom of the wiring, an explicit default for every key. Plain
 * node:/Bun APIs only - unlike src/bin/env.ts, this runs as a bare Bun process with no
 * electrobun import anywhere.
 */
export function loadEnv() {
	return {
		VERSION: getString("RAVEN_VERSION", "1.0.0"),
		/** h2c: gRPC bidi streaming requires HTTP/2. */
		CONTROL_PORT: getNumber("RAVEN_CONTROL_PORT", 8787),
		/** HTTP/1.1: a browser will not speak HTTP/2 to http://localhost without TLS. */
		ADMIN_PORT: getNumber("RAVEN_ADMIN_PORT", 8788),
		/** The admin service reuses the client's own theme data layer - repo-root assets/themes. */
		THEMES_ROOT: getString("RAVEN_THEMES_ROOT", join(import.meta.dir, "..", "..", "assets", "themes")),
		/** The dashboard's static files and browser entrypoint, served by the admin listener's fallback. */
		WEB_ROOT: getString("RAVEN_WEB_ROOT", join(import.meta.dir, "..", "web")),
		/** A server-local scratch file for ThemeStore's settings API; the admin path never reads it. */
		SETTINGS_PATH: getString("RAVEN_SETTINGS_PATH", join(tmpdir(), "raven-server-settings.json")),
	};
}

export type Env = ReturnType<typeof loadEnv>;
