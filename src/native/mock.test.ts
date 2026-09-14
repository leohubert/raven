import type { LayoutKey, Native, WindowHandle } from "./types";

/** A US-QWERTY slice, enough to exercise binding and lookup without touching FFI. */
export const LAYOUT_KEYS_MOCK: LayoutKey[] = [
	{ code: 0, ch: "a" },
	{ code: 1, ch: "s" },
	{ code: 11, ch: "b" },
	{ code: 12, ch: "q" },
	{ code: 35, ch: "p" },
	{ code: 38, ch: "j" },
	{ code: 17, ch: "t" },
	{ code: 46, ch: "m" },
	{ code: 9, ch: "v" },
	{ code: 47, ch: "." },
	{ code: 49, ch: " " }, // space - must never be grabbed as a bare key
	{ code: 65, ch: "." }, // keypad duplicate - must lose to code 47
	// Deliberately out of order: getLayoutIndex must pick the lowest code (the main row)
	// regardless of the order the table arrives in.
	{ code: 83, ch: "1" }, // keypad 1
	{ code: 18, ch: "1" }, // main-row 1, must win
];

export type NativeMock = Native & {
	calls: {
		configured: WindowHandle[];
		clickThrough: Array<{ handle: WindowHandle; enabled: boolean }>;
		registered: Array<{ id: number; keyCode: number; modifiers: number }>;
		becameUIElement: number;
		unregisteredAll: number;
	};
	fire: (id: number) => void;
};

export function nativeMock(overrides: Partial<Native> = {}): NativeMock {
	const calls: NativeMock["calls"] = {
		configured: [],
		clickThrough: [],
		registered: [],
		becameUIElement: 0,
		unregisteredAll: 0,
	};
	let onPressed: ((id: number) => void) | null = null;

	const base: Native = {
		becomeUIElementApp: () => { calls.becameUIElement++; return true; },
		GetWindowHandle: (windowId) => (windowId * 1000) as WindowHandle,
		configureOverlayWindow: (handle) => { calls.configured.push(handle); },
		setClickThrough: (handle, enabled) => { calls.clickThrough.push({ handle, enabled }); },
		forceShow: () => {},
		ListLayoutKeys: () => LAYOUT_KEYS_MOCK,
		initHotkeys: (cb) => { onPressed = cb; return true; },
		registerHotkey: (id, keyCode, modifiers) => {
			calls.registered.push({ id, keyCode, modifiers });
			return true;
		},
		unregisterAllHotkeys: () => { calls.unregisteredAll++; },
		isAccessibilityTrusted: () => false,
		getWindowDebug: () => "{}",
		getViewTree: () => "[]",
	};

	return { ...base, ...overrides, calls, fire: (id) => onPressed?.(id) };
}
