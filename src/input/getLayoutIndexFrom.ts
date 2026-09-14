import { getLayoutIndex, type Native } from "../native";

/** Read the live layout through the platform port and index it by character. */
export function getLayoutIndexFrom(native: Native): Map<string, number> {
	return getLayoutIndex(native.ListLayoutKeys());
}
