export enum EventType {
	OnSoundPlayed = "onSoundPlayed",
	OnThemeLoaded = "onThemeLoaded",
	OnFrontLoaded = "onFrontLoaded"
}

export type EventPayloads = {
	[EventType.OnSoundPlayed]: OnSoundPlayedOpts,
	[EventType.OnThemeLoaded]: OnThemeLoadedOpts,
	[EventType.OnFrontLoaded]: void
}

export type OnSoundPlayedOpts = {
	images: string[],
	count: number | null
	mousePosition: {
		x: number,
		y: number
	}
}

export type KeyItem = {
	key: string,
	sounds: string[],
	images: string[]
}

export type GlobalItem = {
	key: string,
	sounds: string[],
	images: string[]
}

export type Theme = {
	name: string,
	images: string[],
	sounds: string[],
	introSounds: string[],
	global: Record<string, GlobalItem>,
	keys: Record<string, KeyItem>
}

export type OnThemeLoadedOpts = {
	theme: Theme
}