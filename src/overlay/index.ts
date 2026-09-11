import { BrowserWindow } from "electrobun/main/browser-window";
import { defineElectrobunRPC } from "electrobun/main/rpc";

import type { Burst } from "../business";
import type { Theme } from "../themes";
import { getTargetForCursor } from "./getTargetForCursor";
import type { Options } from "./options";
import type { OverlayRPCSchema, OverlayTarget } from "./types";

export { getTargetForCursor } from "./getTargetForCursor";
export type { Options, ScreenPort } from "./options";
export type { Display, OverlayRPCSchema, OverlayTarget, Point } from "./types";

type OverlayWindow = {
	displayId: number;
	window: BrowserWindow<never>;
	send: { burst: (b: Burst) => void; themeLoaded: (p: { theme: Theme }) => void };
};

/**
 * One transparent, click-through, always-on-top window per display.
 *
 * Two rules, both learned the hard way and both load-bearing:
 *  - never pass `passthrough: true` - Electrobun implements it by parking the webview at
 *    -20000,-20000, so the page renders perfectly and is nowhere on screen. Click-through
 *    comes from the window-level `setClickThrough` instead.
 *  - `becomeUIElementApp()` must run before any window is configured, or macOS silently
 *    drops CanJoinAllSpaces and the overlay never covers another app's fullscreen space.
 */
export function newOverlay(opts: Options) {
	const windows: OverlayWindow[] = [];

	function openWindow(display: ReturnType<Options["screen"]["getAllDisplays"]>[number]) {
		const rpc = defineElectrobunRPC<OverlayRPCSchema, "bun">("bun", {
			handlers: {
				requests: { getTheme: () => opts.getTheme() },
			},
		});

		const window = new BrowserWindow({
			title: `raven-${display.id}`,
			url: `${opts.viewUrl}?display=${display.id}&scale=${display.scaleFactor}`,
			frame: {
				x: display.bounds.x,
				y: display.bounds.y,
				width: display.bounds.width,
				height: display.bounds.height,
			},
			titleBarStyle: "hidden",
			transparent: true,
			passthrough: false,
			rpc,
		});

		const handle = opts.native.GetWindowHandle(window.id);
		if (handle !== null) opts.native.configureOverlayWindow(handle);

		windows.push({
			displayId: display.id,
			window: window as never,
			send: (rpc as unknown as { send: OverlayWindow["send"] }).send,
		});
	}

	return {
		OpenOverlays: (): void => {
			opts.native.becomeUIElementApp();
			for (const display of opts.screen.getAllDisplays()) openWindow(display);
		},

		GetTargetUnderCursor: (): OverlayTarget | null =>
			getTargetForCursor(opts.screen.getAllDisplays(), opts.screen.getCursorScreenPoint()),

		SendBurst: (displayId: number, burst: Burst): void => {
			windows.find((w) => w.displayId === displayId)?.send.burst(burst);
		},

		BroadcastTheme: (theme: Theme): void => {
			for (const w of windows) w.send.themeLoaded({ theme });
		},

		SetClickThrough: (enabled: boolean): void => {
			for (const w of windows) {
				const handle = opts.native.GetWindowHandle(w.window.id);
				if (handle !== null) opts.native.setClickThrough(handle, enabled);
			}
		},

		Close: (): void => {
			for (const w of windows) w.window.close();
			windows.length = 0;
		},
	};
}

export type Overlay = ReturnType<typeof newOverlay>;
