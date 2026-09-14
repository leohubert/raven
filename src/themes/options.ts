export type Options = {
	/** Absolute path to the themes root, i.e. the directory holding `<theme>/`. */
	themesRoot: string;
	/** Absolute path to the JSON file holding persisted settings. */
	settingsPath: string;
	/** URL prefix the webview uses to load theme files, e.g. `views://overlay/themes`. */
	assetBaseUrl: string;
};
