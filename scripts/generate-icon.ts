// Render icon.svg into the icon.iconset/ folder Electrobun feeds to iconutil.
import { execFileSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const SOURCE = "icon.svg";
const ICONSET = "icon.iconset";

// The ten names iconutil accepts - any extra file makes it reject the folder.
const VARIANTS = [
	["icon_16x16.png", 16],
	["icon_16x16@2x.png", 32],
	["icon_32x32.png", 32],
	["icon_32x32@2x.png", 64],
	["icon_128x128.png", 128],
	["icon_128x128@2x.png", 256],
	["icon_256x256.png", 256],
	["icon_256x256@2x.png", 512],
	["icon_512x512.png", 512],
	["icon_512x512@2x.png", 1024],
] as const;

try {
	execFileSync("rsvg-convert", ["--version"], { stdio: "ignore" });
} catch {
	console.error("[generate-icon] rsvg-convert not found - brew install librsvg");
	process.exit(1);
}

await mkdir(ICONSET, { recursive: true });
for (const [name, size] of VARIANTS) {
	execFileSync("rsvg-convert", [
		"-w",
		String(size),
		"-h",
		String(size),
		SOURCE,
		"-o",
		join(ICONSET, name),
	]);
}
console.log(`[generate-icon] wrote ${VARIANTS.length} sizes to ${ICONSET}/`);
