// Convert every raster asset under assets/themes to a 128px webp, then delete the source.
import { execFileSync } from "node:child_process";
import { readdir, stat, unlink } from "node:fs/promises";
import { extname, join } from "node:path";

const THEMES_DIR = "assets/themes";
const MAX_SIZE = "128x128>";
const QUALITY = "80";
const CONVERTIBLE = [".png", ".jpg", ".jpeg", ".bmp", ".tiff"];

function getMagick(): string {
	for (const cmd of ["magick", "convert"]) {
		try {
			execFileSync(cmd, ["-version"], { stdio: "ignore" });
			return cmd;
		} catch {}
	}
	console.error("[optimize-images] ImageMagick not found - brew install imagemagick");
	process.exit(1);
}

async function collectSources(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
	const found: string[] = [];
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			found.push(...(await collectSources(full)));
		} else if (CONVERTIBLE.includes(extname(entry.name).toLowerCase())) {
			found.push(full);
		}
	}
	return found;
}

const magick = getMagick();
const sources = await collectSources(THEMES_DIR);
let converted = 0;
let failed = 0;

for (const source of sources) {
	const output = `${source.slice(0, -extname(source).length)}.webp`;
	try {
		execFileSync(magick, [source, "-resize", MAX_SIZE, "-quality", QUALITY, output], {
			stdio: "pipe",
		});
		// Only drop the original once the webp is on disk with real bytes in it.
		const written = await stat(output);
		if (written.size === 0) throw new Error("wrote an empty file");
		await unlink(source);
		console.log(`[optimize-images] ${source} -> ${output} (${written.size} bytes, source deleted)`);
		converted++;
	} catch (error) {
		console.error(`[optimize-images] FAILED ${source}: ${(error as Error).message}`);
		failed++;
	}
}

console.log(`[optimize-images] converted ${converted}, failed ${failed}, source kept on failure`);
if (failed > 0) process.exit(1);
