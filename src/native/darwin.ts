import { dlopen, FFIType as T, JSCallback, ptr, suffix } from "bun:ffi";

import type { Options } from "./options";
import type { LayoutKey, Native, WindowHandle } from "./types";

export function newDarwinNative(opts: Options): Native {
	const core = dlopen(`${opts.runtimeDir}/libElectrobunCore.${suffix}`, {
		getWindowPointer: { args: [T.u32], returns: T.ptr },
	});
	const lib = dlopen(`${opts.nativeDir}/libRavenNative.${suffix}`, {
		raven_become_ui_element_app: { args: [], returns: T.bool },
		raven_configure_overlay_window: { args: [T.ptr], returns: T.void },
		raven_set_ignores_mouse_events: { args: [T.ptr, T.bool], returns: T.void },
		raven_force_show: { args: [T.ptr], returns: T.void },
		raven_layout_table_json: { args: [], returns: T.cstring },
		raven_hotkeys_init: { args: [T.ptr], returns: T.bool },
		raven_register_hotkey: { args: [T.i32, T.u32, T.u32], returns: T.bool },
		raven_unregister_all_hotkeys: { args: [], returns: T.void },
		raven_ax_is_trusted: { args: [], returns: T.bool },
		raven_window_debug_json: { args: [T.ptr], returns: T.cstring },
		raven_view_tree_json: { args: [T.ptr], returns: T.cstring },
	});

	// FFI callbacks and any buffer handed to C must outlive the call, or the GC will
	// collect them mid-flight and the process dies with SIGTRAP.
	const retained: unknown[] = [];

	return {
		becomeUIElementApp: () => lib.symbols.raven_become_ui_element_app(),

		GetWindowHandle: (windowId) => {
			const p = core.symbols.getWindowPointer(windowId);
			return p ? (Number(p) as WindowHandle) : null;
		},

		configureOverlayWindow: (handle) =>
			lib.symbols.raven_configure_overlay_window(handle as never),
		setClickThrough: (handle, enabled) =>
			lib.symbols.raven_set_ignores_mouse_events(handle as never, enabled),
		forceShow: (handle) => lib.symbols.raven_force_show(handle as never),

		ListLayoutKeys: (): LayoutKey[] =>
			JSON.parse(String(lib.symbols.raven_layout_table_json())) as LayoutKey[],

		initHotkeys: (onPressed) => {
			// threadsafe: the Carbon handler fires on the main thread; this marshals the
			// call back onto the JS thread, which is where our handlers must run.
			const callback = new JSCallback((id: number) => onPressed(id), {
				args: [T.i32],
				returns: T.void,
				threadsafe: true,
			});
			retained.push(callback);
			return lib.symbols.raven_hotkeys_init(callback.ptr as never);
		},
		registerHotkey: (id, keyCode, modifiers) =>
			lib.symbols.raven_register_hotkey(id, keyCode, modifiers),
		unregisterAllHotkeys: () => lib.symbols.raven_unregister_all_hotkeys(),

		isAccessibilityTrusted: () => lib.symbols.raven_ax_is_trusted(),
		getWindowDebug: (handle) => String(lib.symbols.raven_window_debug_json(handle as never)),
		getViewTree: (handle) => String(lib.symbols.raven_view_tree_json(handle as never)),
	};
}

// `ptr` is re-exported so callers that need to hand a buffer to C do it through this
// module rather than importing bun:ffi themselves.
export { ptr };
