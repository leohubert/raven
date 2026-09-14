/** Upward impulse, then gravity - the sprites arc up from the cursor and fall off-screen. */
export const GRAVITY = 1500;
export const MIN_UPWARD_SPEED = 420;
export const MAX_UPWARD_SPEED = 840;
export const HORIZONTAL_SPREAD = 520;
export const MAX_SPIN = 9;
export const SPRITE_SIZE = 96;
/** Seconds over which a sprite fades out. */
export const FADE_SECONDS = 2.5;

export type Sprite = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	rot: number;
	vr: number;
	age: number;
	src: string;
};

export type SpawnRequest = {
	x: number;
	y: number;
	count: number;
	sources: string[];
	random?: () => number;
};

export function spawnSprites(req: SpawnRequest): Sprite[] {
	const random = req.random ?? Math.random;
	if (req.sources.length === 0 || req.count <= 0) return [];

	const sprites: Sprite[] = [];
	for (let i = 0; i < req.count; i++) {
		sprites.push({
			x: req.x,
			y: req.y,
			vx: (random() - 0.5) * HORIZONTAL_SPREAD,
			vy: -(MIN_UPWARD_SPEED + random() * (MAX_UPWARD_SPEED - MIN_UPWARD_SPEED)),
			rot: random() * Math.PI * 2,
			vr: (random() - 0.5) * MAX_SPIN,
			age: 0,
			src: req.sources[Math.floor(random() * req.sources.length)] ?? req.sources[0]!,
		});
	}
	return sprites;
}

/**
 * Advance every sprite and drop the ones that have left the viewport.
 *
 * Culling matters: raven's sprites are created per keystroke and never removed unless
 * they fall away, so an uncapped field is a slow leak during fast typing.
 */
export function advanceSprites(
	sprites: Sprite[],
	dt: number,
	viewportHeight: number,
): Sprite[] {
	const alive: Sprite[] = [];
	for (const s of sprites) {
		s.age += dt;
		s.vy += GRAVITY * dt;
		s.x += s.vx * dt;
		s.y += s.vy * dt;
		s.rot += s.vr * dt;
		if (s.y - SPRITE_SIZE > viewportHeight) continue;
		if (s.age > FADE_SECONDS) continue;
		alive.push(s);
	}
	return alive;
}

export function getSpriteOpacity(sprite: Sprite): number {
	return Math.max(0, 1 - sprite.age / FADE_SECONDS);
}
