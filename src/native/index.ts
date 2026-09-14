import { newDarwinNative } from "./darwin";
import { newLinuxNative } from "./linux";
import type { Options } from "./options";
import type { Native } from "./types";

export type { Options } from "./options";
export { getLayoutIndex } from "./layout";
export { MODIFIER } from "./types";
export type { LayoutKey, Native, WindowHandle } from "./types";

export function newNative(opts: Options): Native {
	return process.platform === "darwin" ? newDarwinNative(opts) : newLinuxNative();
}
