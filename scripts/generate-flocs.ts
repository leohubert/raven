// Build the "flocs" theme: every key says its own name in French, in a Toad-ish voice.
//
// Entirely offline and rerunnable - macOS `say` speaks, ffmpeg squeezes the voice up into
// Toad territory, ImageMagick draws the mushroom. The theme tree is rebuilt from scratch
// on every run, so this script is the source of truth rather than the assets it writes.
//
//   bun scripts/generate-flocs.ts --preview [dir]   # one sample per voice, to choose from
//   bun scripts/generate-flocs.ts [--voice <name>]  # write assets/themes/flocs
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

const THEME_DIR = "assets/themes/flocs";
const FALLBACK_DIR = join(THEME_DIR, "global", "floc");
const SPRITE_NAME = "floc.webp";
const PREVIEW_DEFAULT_DIR = "flocs-preview";
const PREVIEW_TEXT = "a, bé, cé, double vé, point d'exclamation";

type Voice = {
	name: string;
	/** `say -v` - the exact name from `say -v '?'`. */
	say: string;
	/** Words per minute. */
	rate: number;
	/** `say`'s own base pitch, 30 (deep) to 80 (high). */
	pbas: number;
	/** Resample factor: raises pitch and speed together, which is what chipmunks a voice. */
	pitch: number;
	/** Applied after the resample - below 1 it gives back some of the duration, not the pitch. */
	tempo: number;
	/** Cutting the low end is what makes the result read as nasal rather than just fast. */
	highpass: number;
};

const VOICES: Voice[] = [
	{ name: "flo", say: "Flo (French (France))", rate: 200, pbas: 65, pitch: 1.45, tempo: 0.78, highpass: 180 },
	{ name: "sandy", say: "Sandy (French (France))", rate: 210, pbas: 70, pitch: 1.38, tempo: 0.82, highpass: 220 },
	{ name: "thomas", say: "Thomas", rate: 180, pbas: 50, pitch: 1.62, tempo: 0.7, highpass: 160 },
	{ name: "rocko", say: "Rocko (French (France))", rate: 200, pbas: 60, pitch: 1.5, tempo: 0.75, highpass: 300 },
];

const DEFAULT_VOICE = "flo";

/**
 * What each key says, as `<character>: [file slug, spoken text]`.
 *
 * The directory raven looks up is the character itself (`theme.keys[char]` in pickGroup),
 * so only the file inside it gets a slug - `assets/themes/flocs/;/point-virgule.m4a`.
 * Letters are spelled the way they are said out loud in French, not the way they are
 * written: `w` is "double vé", `q` is "ku", otherwise the TTS reads them as words.
 */
const KEYS: Record<string, [slug: string, text: string]> = {
	a: ["a", "a"],
	b: ["be", "bé"],
	c: ["ce", "cé"],
	d: ["de", "dé"],
	e: ["e", "eu"],
	f: ["f", "effe"],
	g: ["g", "gé"],
	h: ["h", "ache"],
	i: ["i", "i"],
	j: ["j", "ji"],
	k: ["k", "ka"],
	l: ["l", "elle"],
	m: ["m", "emme"],
	n: ["n", "enne"],
	o: ["o", "o"],
	p: ["p", "pé"],
	q: ["q", "ku"],
	r: ["r", "erre"],
	s: ["s", "esse"],
	t: ["t", "té"],
	u: ["u", "u"],
	v: ["v", "vé"],
	w: ["w", "double vé"],
	x: ["x", "ixe"],
	y: ["y", "i grec"],
	z: ["z", "zède"],

	// Digits reach raven from the numeric keypad: on AZERTY the main row types & é " ' …
	"0": ["zero", "zéro"],
	"1": ["un", "un"],
	"2": ["deux", "deux"],
	"3": ["trois", "trois"],
	"4": ["quatre", "quatre"],
	"5": ["cinq", "cinq"],
	"6": ["six", "six"],
	"7": ["sept", "sept"],
	"8": ["huit", "huit"],
	"9": ["neuf", "neuf"],

	"²": ["carre", "carré"],
	"&": ["esperluette", "esperluette"],
	"é": ["e-accent-aigu", "é"],
	"'": ["apostrophe", "apostrophe"],
	"(": ["parenthese", "parenthèse"],
	"-": ["tiret", "tiret"],
	"è": ["e-accent-grave", "è"],
	_: ["tiret-bas", "tiret bas"],
	"ç": ["cedille", "cé cédille"],
	"à": ["a-accent-grave", "à"],
	")": ["parenthese-fermante", "parenthèse fermante"],
	"=": ["egal", "égal"],
	$: ["dollar", "dollar"],
	"ù": ["u-accent-grave", "ù"],
	"*": ["etoile", "étoile"],
	",": ["virgule", "virgule"],
	";": ["point-virgule", "point virgule"],
	"!": ["point-exclamation", "point d'exclamation"],
	"+": ["plus", "plus"],
};

/**
 * Keys deliberately left without a directory of their own.
 *
 * `scan.ts` builds asset URLs by plain concatenation, so a directory named `"`, `^` or `<`
 * comes back percent-encoded from the webview's URL parser and the clip never loads; `:`
 * is the one character Finder and the dmg packager still rewrite; `/` cannot be a
 * directory name at all, and `.` silently resolves to the theme root - a directory named
 * after it would drop its clip beside intro.m4a. Each of them falls through to the global
 * floc, so the key is never silent - it just does not say its own name.
 */
const UNCOVERED = ['"', "^", "<", ":", "/", "."];

function run(cmd: string, args: string[]): void {
	execFileSync(cmd, args, { stdio: "pipe" });
}

function requireTools(): void {
	const missing = ["say", "ffmpeg", "ffprobe", "magick"].filter((cmd) => !Bun.which(cmd));
	if (missing.length === 0) return;
	console.error(`[flocs] missing: ${missing.join(", ")} - brew install ffmpeg imagemagick`);
	process.exit(1);
}

/** `asetrate` wants an absolute rate, and `say` picks its own per voice. */
function getSampleRate(path: string): number {
	const out = execFileSync(
		"ffprobe",
		["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate", "-of", "csv=p=0", path],
		{ encoding: "utf8" },
	);
	return Number.parseInt(out.trim(), 10);
}

async function synth(voice: Voice, text: string, outPath: string): Promise<void> {
	const raw = `${outPath}.aiff`;
	run("say", ["-v", voice.say, "-r", String(voice.rate), "-o", raw, `[[pbas ${voice.pbas}]] ${text}`]);
	const rate = getSampleRate(raw);
	run("ffmpeg", [
		"-y",
		"-loglevel",
		"error",
		"-i",
		raw,
		"-af",
		[
			`asetrate=${Math.round(rate * voice.pitch)}`,
			"aresample=44100",
			`atempo=${voice.tempo}`,
			`highpass=f=${voice.highpass}`,
			"dynaudnorm=p=0.9",
		].join(","),
		"-c:a",
		"aac",
		"-b:a",
		"96k",
		outPath,
	]);
	await rm(raw);
	if ((await stat(outPath)).size === 0) throw new Error(`empty clip for "${text}"`);
}

/** Toad's cap drawn from primitives: the Apple emoji font is bitmap-only and renders grey. */
function drawSprite(outPath: string): void {
	run("magick", [
		"-size",
		"128x128",
		"xc:none",
		"-fill",
		"#f4efe2",
		"-draw",
		"roundrectangle 46,66 82,116 12,12",
		"-fill",
		"#f9f6ef",
		"-draw",
		"ellipse 64,72 54,46 180,360",
		"-fill",
		"#e1332b",
		"-draw",
		"circle 36,58 36,45",
		"-draw",
		"circle 92,58 92,45",
		"-draw",
		"circle 64,38 64,25",
		"-fill",
		"#2b2b2b",
		"-draw",
		"circle 55,88 55,84",
		"-draw",
		"circle 73,88 73,84",
		"-quality",
		"80",
		outPath,
	]);
}

function getVoice(name: string): Voice {
	const voice = VOICES.find((v) => v.name === name);
	if (voice) return voice;
	console.error(`[flocs] unknown voice "${name}" - try ${VOICES.map((v) => v.name).join(", ")}`);
	process.exit(1);
}

async function writePreview(dir: string): Promise<void> {
	await mkdir(dir, { recursive: true });
	for (const voice of VOICES) {
		const out = join(dir, `${voice.name}.m4a`);
		await synth(voice, PREVIEW_TEXT, out);
		console.log(`[flocs] ${out}`);
	}
	console.log(`[flocs] ${VOICES.length} samples - afplay them, then rerun with --voice <name>`);
}

async function writeTheme(voice: Voice): Promise<void> {
	await rm(THEME_DIR, { recursive: true, force: true });
	await mkdir(THEME_DIR, { recursive: true });

	const sprite = join(THEME_DIR, SPRITE_NAME);
	drawSprite(sprite);

	for (const [char, [slug, text]] of Object.entries(KEYS)) {
		const dir = join(THEME_DIR, char);
		await mkdir(dir, { recursive: true });
		await synth(voice, text, join(dir, `${slug}.m4a`));
		await copyFile(sprite, join(dir, SPRITE_NAME));
	}

	// The pool every key without a directory of its own draws from.
	await mkdir(FALLBACK_DIR, { recursive: true });
	await synth(voice, "floc", join(FALLBACK_DIR, "floc.m4a"));
	await copyFile(sprite, join(FALLBACK_DIR, SPRITE_NAME));

	// Only lives at the top level to seed the per-key copies; a loose image there would be
	// scanned into the theme as an asset nothing ever draws.
	await rm(sprite);

	const count = Object.keys(KEYS).length;
	console.log(`[flocs] ${THEME_DIR}: ${count} keys in ${voice.say}, + the global floc`);
	console.log(`[flocs] falling back to the floc: ${UNCOVERED.join(" ")}`);
}

requireTools();

const args = process.argv.slice(2);
const previewAt = args.indexOf("--preview");
if (previewAt !== -1) {
	await writePreview(args[previewAt + 1] ?? PREVIEW_DEFAULT_DIR);
} else {
	const voiceAt = args.indexOf("--voice");
	await writeTheme(getVoice(voiceAt === -1 ? DEFAULT_VOICE : (args[voiceAt + 1] ?? DEFAULT_VOICE)));
}
