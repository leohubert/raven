import Electrobun, { Electroview } from "electrobun/view";

import type { Burst } from "../../business";
import type { Theme } from "../../themes";
import type { OverlayRPCSchema } from "../../overlay/types";
import { newAudioPlayer } from "./audio";
import {
	advanceSprites,
	getSpriteOpacity,
	spawnSprites,
	SPRITE_SIZE,
	type Sprite,
} from "./particles";

const canvas = document.getElementById("stage") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const audio = newAudioPlayer();
const images = new Map<string, HTMLImageElement>();
let sprites: Sprite[] = [];

function resize() {
	// Backing store in device pixels, drawing in CSS pixels.
	canvas.width = Math.floor(innerWidth * devicePixelRatio);
	canvas.height = Math.floor(innerHeight * devicePixelRatio);
	ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
resize();
addEventListener("resize", resize);

function getImage(url: string): HTMLImageElement {
	const existing = images.get(url);
	if (existing) return existing;
	const image = new Image();
	image.src = url;
	images.set(url, image);
	return image;
}

function preloadTheme(theme: Theme | null) {
	if (!theme) return;
	const groups = [...theme.groups, ...Object.values(theme.keys)];
	for (const group of groups) {
		for (const image of group.images) getImage(image.url);
		audio.preload(group.sounds.map((s) => s.url));
	}
}

function onBurst(burst: Burst) {
	if (burst.sound) audio.play(burst.sound.url);
	sprites = sprites.concat(
		spawnSprites({
			x: burst.position.x,
			y: burst.position.y,
			count: burst.count,
			sources: burst.images.map((i) => i.url),
		}),
	);
}

let last = performance.now();
function frame(now: number) {
	// Clamp so a background tab or a stalled frame cannot teleport every sprite.
	const dt = Math.min((now - last) / 1000, 1 / 30);
	last = now;

	ctx.clearRect(0, 0, innerWidth, innerHeight);
	sprites = advanceSprites(sprites, dt, innerHeight);
	for (const sprite of sprites) {
		const image = images.get(sprite.src);
		if (!image?.complete || image.naturalWidth === 0) continue;
		ctx.save();
		ctx.globalAlpha = getSpriteOpacity(sprite);
		ctx.translate(sprite.x, sprite.y);
		ctx.rotate(sprite.rot);
		const ratio = image.naturalHeight / image.naturalWidth;
		const width = SPRITE_SIZE;
		const height = SPRITE_SIZE * ratio;
		ctx.drawImage(image, -width / 2, -height / 2, width, height);
		ctx.restore();
	}
	requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

const rpc = Electroview.defineRPC<OverlayRPCSchema>({
	handlers: {
		messages: {
			burst: onBurst,
			themeLoaded: ({ theme }) => preloadTheme(theme),
		},
	},
});

const view = new Electrobun.Electroview({ rpc });

// Handshake: ask for the theme once, rather than waiting for a theme-change broadcast
// that only fires on the *second* load. The original had this bug - it guarded the
// broadcast with `isUpdate`, so a fresh start preloaded nothing.
void (async () => {
	const theme = await (view.rpc as unknown as {
		request: { getTheme: () => Promise<Theme | null> };
	}).request.getTheme();
	preloadTheme(theme);
})();
