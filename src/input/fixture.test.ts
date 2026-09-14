import type { Burst } from "../business";
import type { Theme } from "../themes";
import type { OverlayTarget } from "../overlay";
import { nativeMock, type NativeMock } from "../native/mock.test";
import { themeMock } from "../business/mock.test";
import { newInput, type Options } from "./index";

export function overlayStub(target: OverlayTarget | null = {
	displayId: 5,
	position: { x: 100, y: 200 },
	scaleFactor: 2,
}) {
	const calls = {
		bursts: [] as Array<{ displayId: number; burst: Burst }>,
		themes: [] as Theme[],
		clickThrough: [] as boolean[],
	};
	return {
		calls,
		overlay: {
			OpenOverlays: () => {},
			GetTargetUnderCursor: () => target,
			SendBurst: (displayId: number, burst: Burst) => calls.bursts.push({ displayId, burst }),
			BroadcastTheme: (theme: Theme) => calls.themes.push(theme),
			SetClickThrough: (enabled: boolean) => calls.clickThrough.push(enabled),
			Close: () => {},
		},
	};
}

export function businessStub(burst: Burst | null) {
	const calls = { presses: [] as string[], cycles: 0 };
	return {
		calls,
		business: {
			loadTheme: async () => themeMock(),
			cycleTheme: async () => {
				calls.cycles++;
				return themeMock({ name: "toad" });
			},
			getCurrentTheme: () => themeMock(),
			onKeyPressed: (_ctx: unknown, req: { char: string }) => {
				calls.presses.push(req.char);
				return burst;
			},
			isHealthy: () => true,
		},
	};
}

export const BURST_MOCK: Burst = {
	position: { x: 100, y: 200 },
	count: 8,
	images: [],
	sound: null,
	scaleFactor: 2,
};

export function inputFixture(
	over: { burst?: Burst | null; target?: OverlayTarget | null; native?: NativeMock } = {},
) {
	const native = over.native ?? nativeMock();
	const { overlay, calls: overlayCalls } = overlayStub(
		over.target === undefined ? undefined : over.target,
	);
	const { business, calls: businessCalls } = businessStub(
		over.burst === undefined ? BURST_MOCK : over.burst,
	);
	const quit = { count: 0 };
	const version = { count: 0 };
	const opts = {
		native,
		business,
		overlay,
		onQuit: () => quit.count++,
		showVersion: () => version.count++,
	} as unknown as Options;

	return { input: newInput(opts), native, overlayCalls, businessCalls, quit, version };
}
