import type { Business } from "../business";
import type { Native } from "../native";
import type { Overlay } from "../overlay";

export type Options = {
	native: Native;
	business: Business;
	overlay: Overlay;
	/** Called by the quit hotkey. Bootstrap owns the actual shutdown. */
	onQuit: () => void;
	/** Shown by the version hotkey. */
	showVersion: () => void;
};
