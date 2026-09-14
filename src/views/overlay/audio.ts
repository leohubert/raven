/**
 * Sound playback in the webview.
 *
 * The original shelled out to `afplay` through `play-sound` for every keystroke, and any
 * failure called `app.quit()`. Playing in the renderer removes the subprocess per key,
 * the platform-player dependency, and the crash-on-missing-binary path.
 */
export function newAudioPlayer() {
	const preloaded = new Map<string, HTMLAudioElement>();

	function get(url: string): HTMLAudioElement {
		const existing = preloaded.get(url);
		if (existing) return existing;
		const audio = new Audio(url);
		audio.preload = "auto";
		preloaded.set(url, audio);
		return audio;
	}

	return {
		/** Warm the cache so the first keystroke is not the one that waits on disk. */
		preload: (urls: string[]): void => {
			for (const url of urls) get(url).load();
		},

		play: (url: string): void => {
			// Clone so overlapping keystrokes layer instead of restarting one element.
			const node = get(url).cloneNode() as HTMLAudioElement;
			node.play().catch(() => {
				// A missing or unplayable clip must never take the app down.
				console.warn("[raven] could not play", url);
			});
		},
	};
}

export type AudioPlayer = ReturnType<typeof newAudioPlayer>;
