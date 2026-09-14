import type { Options } from "./options";
import type { State } from "./types";

/** Options plus the runtime state, partially applied into every business method. */
export type Deps = Options & {
	state: State;
	random: () => number;
};
