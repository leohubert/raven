import type { Theme, ThemeAsset, ThemeGroup } from "../themes";

export function assetMock(rel: string, kind: ThemeAsset["kind"] = "image"): ThemeAsset {
	return { rel, url: `views://overlay/themes/${rel}`, kind };
}

export function groupMock(overrides: Partial<ThemeGroup> = {}): ThemeGroup {
	return {
		name: "gael",
		sounds: [assetMock("raven/global/gael/gael.m4a", "sound")],
		images: [
			assetMock("raven/global/gael/1.png"),
			assetMock("raven/global/gael/2.png"),
			assetMock("raven/global/gael/3.png"),
			assetMock("raven/global/gael/4.png"),
		],
		...overrides,
	};
}

export function themeMock(overrides: Partial<Theme> = {}): Theme {
	return {
		name: "raven",
		intro: [assetMock("raven/intro.m4a", "sound")],
		groups: [
			groupMock(),
			groupMock({
				name: "manu",
				sounds: [assetMock("raven/global/manu/manu.m4a", "sound")],
				images: [assetMock("raven/global/manu/manu.webp")],
			}),
		],
		keys: {
			a: {
				name: "a",
				sounds: [assetMock("raven/a/manu-a.m4a", "sound")],
				images: [assetMock("raven/a/manu-a.png")],
			},
		},
		...overrides,
	};
}
