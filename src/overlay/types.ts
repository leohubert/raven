import type { Burst } from "../business";
import type { Theme } from "../themes";

export type Display = {
	id: number;
	bounds: { x: number; y: number; width: number; height: number };
	scaleFactor: number;
	isPrimary: boolean;
};

export type Point = { x: number; y: number };

/**
 * One file of a theme pushed at runtime. Base64 rather than bytes because Electrobun's RPC
 * is JSON-based; the renderer turns each one into a blob URL.
 */
export type PushedAsset = { rel: string; mime: string; base64: string };

/** The window a keystroke should burst in, plus the cursor position inside it. */
export type OverlayTarget = {
	displayId: number;
	position: Point;
	scaleFactor: number;
};

/**
 * The main <-> webview contract. Single source of truth: the renderer imports the same
 * type, so a change on one side is a type error on the other.
 */
export type OverlayRPCSchema = {
	bun: {
		requests: {
			/** Handshake: the renderer asks for the theme once it is ready to preload. */
			getTheme: { params: void; response: Theme | null };
		};
		messages: Record<never, never>;
	};
	webview: {
		requests: Record<never, never>;
		messages: {
			burst: Burst;
			themeLoaded: { theme: Theme };
			/**
			 * A theme's files, arriving from the server. The webview cannot load them any other
			 * way: `views://` only serves paths baked into the signed bundle at build time.
			 */
			pushedTheme: { theme: string; assets: PushedAsset[] };
		};
	};
};
