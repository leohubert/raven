import type { Theme } from "../themes";
import type { Deps } from "./deps";

export function getCurrentTheme(deps: Deps): Theme | null {
	return deps.state.theme;
}
