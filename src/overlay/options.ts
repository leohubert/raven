import type { Theme } from "../themes";
import type { Native } from "../native";
import type { Display, Point } from "./types";

export type ScreenPort = {
	getAllDisplays: () => Display[];
	getCursorScreenPoint: () => Point;
};

export type Options = {
	native: Native;
	screen: ScreenPort;
	/** URL of the overlay view, e.g. `views://overlay/index.html`. */
	viewUrl: string;
	/** Answers the renderer's handshake. */
	getTheme: () => Theme | null;
};
