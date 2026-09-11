import { join } from "node:path";
import { homedir } from "node:os";

import * as PATHS from "electrobun/main/paths";

const APP_IDENTIFIER = "ai.bodyguard.raven";

function getString(key: string, fallback: string): string {
	const value = process.env[key];
	return value && value.length > 0 ? value : fallback;
}

/**
 * One loadEnv at the bottom of the wiring, an explicit default for every key.
 *
 * `copy` destinations resolve under Contents/Resources/app, which is the parent of
 * VIEWS_FOLDER, and the dylibs ship next to the executable in Contents/MacOS.
 */
export function loadEnv() {
	const appDir = PATHS.VIEWS_FOLDER.replace(/\/views$/, "");
	return {
		APP_IDENTIFIER,
		VERSION: getString("RAVEN_VERSION", "1.0.0"),
		/** Themes are copied into the view root - `views://` is the only scheme that works. */
		THEMES_ROOT: getString("RAVEN_THEMES_ROOT", join(PATHS.VIEWS_FOLDER, "overlay", "themes")),
		ASSET_BASE_URL: getString("RAVEN_ASSET_BASE_URL", "views://overlay/themes"),
		VIEW_URL: getString("RAVEN_VIEW_URL", "views://overlay/index.html"),
		NATIVE_DIR: getString("RAVEN_NATIVE_DIR", join(appDir, "native")),
		RUNTIME_DIR: getString("RAVEN_RUNTIME_DIR", process.cwd()),
		SETTINGS_PATH: getString(
			"RAVEN_SETTINGS_PATH",
			join(homedir(), "Library", "Application Support", APP_IDENTIFIER, "settings.json"),
		),
	};
}

export type Env = ReturnType<typeof loadEnv>;
