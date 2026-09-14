import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { Settings } from "./types";

const DEFAULT_SETTINGS: Settings = { theme: null };

/** Missing or corrupt settings are not an error - raven just falls back to defaults. */
export async function GetSettings(settingsPath: string): Promise<Settings> {
	const raw = await readFile(settingsPath, "utf8").catch(() => null);
	if (raw === null) return { ...DEFAULT_SETTINGS };
	try {
		const parsed = JSON.parse(raw) as Partial<Settings>;
		return {
			theme: typeof parsed.theme === "string" ? parsed.theme : null,
		};
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

export async function UpdateSettings(
	settingsPath: string,
	patch: Partial<Settings>,
): Promise<Settings> {
	const next: Settings = { ...(await GetSettings(settingsPath)), ...patch };
	await mkdir(dirname(settingsPath), { recursive: true });
	await writeFile(settingsPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
	return next;
}
