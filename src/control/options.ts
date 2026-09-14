import type { Business } from "../business";
import type { Input } from "../input";
import type { Overlay, ScreenPort } from "../overlay";
import type { ThemeStore } from "../themes";

export type Options = {
	/** The server's control listener, e.g. http://127.0.0.1:8787 (h2c). */
	controlUrl: string;
	version: string;
	business: Business;
	input: Input;
	overlay: Overlay;
	themes: ThemeStore;
	/** Reused from overlay's construction - only the display enumeration feeds Hello. */
	screen: ScreenPort;
	/**
	 * How long an active client tolerates total silence from the server before releasing
	 * the keyboard on its own (see index.ts's dead-man's switch). Defaults to 60s - well
	 * past an ordinary blip, since dial()'s own backoff only reaches its 30s cap after
	 * several failed attempts, but short enough that a server that truly never comes back
	 * does not hold someone's keyboard hostage indefinitely. Overridable for tests.
	 */
	deadMansSwitchMs?: number;
};
