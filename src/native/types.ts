/** Opaque pointer to an NSWindow. Only `src/native` may create or dereference one. */
export type WindowHandle = number & { readonly __windowHandle: unique symbol };

/** One physical key and the character it produces on the *current* keyboard layout. */
export type LayoutKey = {
	code: number;
	ch: string;
};

/** Carbon modifier masks, as RegisterEventHotKey expects them. */
export const MODIFIER = {
	none: 0,
	command: 0x0100,
	shift: 0x0200,
	option: 0x0800,
	control: 0x1000,
} as const;

/**
 * The platform port. Everything that is not portable TypeScript lives behind this, so
 * the rest of the app never touches FFI and can be tested with a plain object.
 */
export type Native = {
	/**
	 * Transform the process into a UIElement app. Must be called before any overlay
	 * window is configured: macOS 10.14+ drops CanJoinAllSpaces when FullScreenAuxiliary
	 * is set unless the process is UIElement, and the overlay then never appears over
	 * another app's fullscreen space. Also hides the dock icon.
	 */
	becomeUIElementApp: () => boolean;

	GetWindowHandle: (windowId: number) => WindowHandle | null;

	/**
	 * Apply the full overlay configuration: screensaver level, all-spaces +
	 * fullscreen-auxiliary, no shadow, click-through, hidden from Mission Control.
	 */
	configureOverlayWindow: (handle: WindowHandle) => void;
	setClickThrough: (handle: WindowHandle, enabled: boolean) => void;
	forceShow: (handle: WindowHandle) => void;

	/** Every printable key on the live layout. Replaces raven's QWERTY-literal key list. */
	ListLayoutKeys: () => LayoutKey[];

	/**
	 * Carbon RegisterEventHotKey. Needs no Accessibility or Input Monitoring grant and
	 * consumes the keystroke - both unlike an NSEvent global monitor.
	 */
	initHotkeys: (onPressed: (id: number) => void) => boolean;
	registerHotkey: (id: number, keyCode: number, modifiers: number) => boolean;
	unregisterAllHotkeys: () => void;

	/** Diagnostics only. */
	isAccessibilityTrusted: () => boolean;
	getWindowDebug: (handle: WindowHandle) => string;
	getViewTree: (handle: WindowHandle) => string;
};
