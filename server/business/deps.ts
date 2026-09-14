import type { Options } from "./options";
import type { RosterListener, State } from "./types";

/** Options plus the runtime state, partially applied into every pool method. */
export type Deps = Options & {
	state: State;
	listeners: Set<RosterListener>;
};
