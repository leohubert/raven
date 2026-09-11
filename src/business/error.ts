export class NoThemeLoadedError extends Error {
	constructor() {
		super("no theme is loaded");
		this.name = "NoThemeLoadedError";
	}
}

export class NoThemesAvailableError extends Error {
	constructor(themesRoot?: string) {
		super(`no themes found${themesRoot ? ` in ${themesRoot}` : ""}`);
		this.name = "NoThemesAvailableError";
	}
}
