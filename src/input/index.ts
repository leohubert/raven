import { newContext } from "../business";
import { getLayoutIndexFrom } from "./getLayoutIndexFrom";
import { BARE_KEY_BLOCKLIST, CONTROL_BINDINGS, type ControlAction } from "./hotkeys";
import type { Options } from "./options";

export { BARE_KEY_BLOCKLIST, CONTROL_BINDINGS } from "./hotkeys";
export type { ControlAction, ControlBinding } from "./hotkeys";
export type { Options } from "./options";

type Registration =
	| { kind: "bare"; char: string }
	| { kind: "control"; action: ControlAction };

/**
 * Keyboard capture, via Carbon RegisterEventHotKey in the native layer.
 *
 * Deliberately *not* Electrobun's GlobalShortcut, which uses a global NSEvent monitor:
 * that needs an Input Monitoring grant, fails silently without it, and cannot consume the
 * keystroke. Carbon needs no permission and swallows the key, which is how the original
 * behaved.
 *
 * Every bare key is resolved from the live keyboard layout rather than a QWERTY literal,
 * which is what fixes the quit shortcut on AZERTY (upstream issue #2).
 */
export function newInput(opts: Options) {
	const registrations = new Map<number, Registration>();
	let clickThrough = true;
	let nextId = 1;

	function handleBareKey(char: string) {
		const target = opts.overlay.GetTargetUnderCursor();
		if (!target) return;
		const burst = opts.business.onKeyPressed(newContext(), {
			char,
			position: target.position,
			scaleFactor: target.scaleFactor,
		});
		if (burst) opts.overlay.SendBurst(target.displayId, burst);
	}

	async function handleControl(action: ControlAction) {
		switch (action) {
			case "quit":
				opts.onQuit();
				return;
			case "cycleTheme": {
				const theme = await opts.business.cycleTheme(newContext());
				opts.overlay.BroadcastTheme(theme);
				return;
			}
			case "toggleClickThrough":
				clickThrough = !clickThrough;
				opts.overlay.SetClickThrough(clickThrough);
				return;
			case "showVersion":
				opts.showVersion();
				return;
		}
	}

	function onPressed(id: number) {
		const registration = registrations.get(id);
		if (!registration) return;
		if (registration.kind === "bare") handleBareKey(registration.char);
		else void handleControl(registration.action);
	}

	function register(registration: Registration, code: number, modifiers: number): boolean {
		const id = nextId++;
		if (!opts.native.registerHotkey(id, code, modifiers)) return false;
		registrations.set(id, registration);
		return true;
	}

	return {
		/**
		 * Grab the keyboard. Reports what could NOT be grabbed as well as what could:
		 * RegisterEventHotKey refuses a combination another app already owns, and a
		 * silently missing key is very hard to notice later.
		 */
		Start: (): { bare: number; control: number; failed: string[] } => {
			opts.native.initHotkeys(onPressed);
			const index = getLayoutIndexFrom(opts.native);

			const failed: string[] = [];

			let control = 0;
			for (const binding of CONTROL_BINDINGS) {
				const code = index.get(binding.char);
				if (code === undefined) {
					failed.push(`${binding.description} (not on this layout)`);
					continue;
				}
				if (register({ kind: "control", action: binding.action }, code, binding.modifiers)) {
					control++;
				} else {
					failed.push(`${binding.description} (already taken)`);
				}
			}

			// Bare keys last: a control combination must win if it shares a physical key.
			let bare = 0;
			for (const [char, code] of index) {
				if (BARE_KEY_BLOCKLIST.has(char)) continue;
				if (register({ kind: "bare", char }, code, 0)) bare++;
				else failed.push(char);
			}

			return { bare, control, failed };
		},

		Stop: (): void => {
			opts.native.unregisterAllHotkeys();
			registrations.clear();
		},

		isClickThrough: (): boolean => clickThrough,
	};
}

export type Input = ReturnType<typeof newInput>;
