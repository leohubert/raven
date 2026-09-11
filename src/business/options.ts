import type { Native } from "../native";
import type { ThemeStore } from "../themes";

export type Options = {
	themes: ThemeStore;
	native: Native;
	/** Injected so tests are deterministic. Defaults to Math.random. */
	random?: () => number;
};
