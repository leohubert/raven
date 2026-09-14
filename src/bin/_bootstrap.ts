import { Screen } from "electrobun/main/native";

import { newBusiness, type Business } from "../business";
import { newControl, type Control } from "../control";
import { newInput, type Input } from "../input";
import { newNative, type Native } from "../native";
import { newOverlay, type Overlay } from "../overlay";
import { newThemeStore, type ThemeStore } from "../themes";
import { loadEnv, type Env } from "./env";

export type { Env } from "./env";

export type Services = {
	native: Native;
	themes: ThemeStore;
	business: Business;
	overlay: Overlay;
	input: Input;
	control: Control;
};

export type BootstrapResult = {
	env: Env;
	services: Services;
	cleanup: () => void;
};

/**
 * The single dependency-injection site. Everything is constructed here with plain
 * constructors and passed down; nothing else in the app opens a resource or reaches for
 * a global.
 */
export function bootstrap(): BootstrapResult {
	const env = loadEnv();

	const native = newNative({ nativeDir: env.NATIVE_DIR, runtimeDir: env.RUNTIME_DIR });

	const themes = newThemeStore({
		themesRoot: env.THEMES_ROOT,
		settingsPath: env.SETTINGS_PATH,
		assetBaseUrl: env.ASSET_BASE_URL,
	});

	const business = newBusiness({ themes, native });

	const screen = {
		getAllDisplays: () => Screen.getAllDisplays(),
		getCursorScreenPoint: () => Screen.getCursorScreenPoint(),
	};

	const overlay = newOverlay({
		native,
		screen,
		viewUrl: env.VIEW_URL,
		getTheme: () => business.getCurrentTheme(),
	});

	let input: Input;
	let control: Control;
	const cleanup = () => {
		input?.Stop();
		control?.Stop();
		overlay.Close();
	};

	input = newInput({
		native,
		business,
		overlay,
		onQuit: () => {
			cleanup();
			quit();
		},
		showVersion: () => showVersion(env),
	});

	control = newControl({
		controlUrl: env.CONTROL_URL,
		version: env.VERSION,
		business,
		input,
		overlay,
		themes,
		screen,
	});

	return { env, services: { native, themes, business, overlay, input, control }, cleanup };
}

function quit() {
	// Utils.quit can decline; never leave a dockless, menu-less app running.
	void import("electrobun/main/utils").then((Utils) => {
		if (!Utils.quit(0)) process.exit(0);
		setTimeout(() => process.exit(0), 1500);
	});
}

function showVersion(env: Env) {
	void import("electrobun/main/utils").then((Utils) =>
		Utils.showMessageBox({
			title: "raven",
			message: `raven ${env.VERSION}`,
			buttons: ["OK"],
		}),
	);
}
