import type { Native } from "./types";

const NOT_IMPLEMENTED = "raven's native layer is macOS-only for now";

/**
 * Placeholder so the port is total. The Linux overlay needs a different mechanism
 * entirely - X11 override-redirect or a wlr-layer-shell surface on Wayland - and
 * click-through is not reliably available under Wayland at all.
 */
export function newLinuxNative(): Native {
	const unsupported = () => {
		throw new Error(NOT_IMPLEMENTED);
	};
	return {
		becomeUIElementApp: () => false,
		GetWindowHandle: () => null,
		configureOverlayWindow: unsupported,
		setClickThrough: unsupported,
		forceShow: unsupported,
		ListLayoutKeys: () => [],
		initHotkeys: () => false,
		registerHotkey: () => false,
		unregisterAllHotkeys: () => {},
		isAccessibilityTrusted: () => false,
		getWindowDebug: () => "{}",
		getViewTree: () => "[]",
	};
}
