import { bootstrap } from "./_bootstrap";
import { newContext } from "../business";

/**
 * The runnable. Opens one overlay per display, loads a theme, then grabs the keyboard.
 *
 * Order matters: the overlays must exist before the theme is broadcast, and the theme
 * must be loaded before any key is grabbed, or the first keystroke arrives with nothing
 * to show.
 */
async function main() {
	const { env, services, cleanup } = bootstrap();

	services.overlay.OpenOverlays();

	const theme = await services.business.loadTheme(newContext());
	services.overlay.BroadcastTheme(theme);

	const { bare, control, failed } = services.input.Start();

	console.log(
		`[raven] ${env.VERSION} ready - theme "${theme.name}", ${bare} keys grabbed, ${control} hotkeys`,
	);
	if (failed.length > 0) {
		// RegisterEventHotKey refuses a combination another app already holds. Say so.
		console.warn(`[raven] could not grab ${failed.length}: ${failed.join(" ")}`);
	}
	console.log("[raven] OPTION+P or OPTION+Q quit, OPTION+T next theme, OPTION+M click-through");

	process.on("SIGINT", cleanup);
	process.on("SIGTERM", cleanup);
}

main().catch((error) => {
	console.error("[raven] failed to start:", error);
	process.exit(1);
});
