import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createServer, get } from "node:http";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { bundleCss, bundleMain, newDashboardFallback, resolveStaticPath, scanClassCandidates } from "./static";

// happy-dom's globally-registered `fetch` (see happydom.ts) enforces the Same Origin Policy
// against its own document origin, which rejects a request to this test's ephemeral
// 127.0.0.1 port as cross-origin. node:http's `get` is a raw TCP request with no such policy.
function getBody(url: string): Promise<string> {
	return new Promise((resolvePromise, reject) => {
		get(url, (res) => {
			const chunks: Buffer[] = [];
			res.on("data", (chunk: Buffer) => chunks.push(chunk));
			res.on("end", () => resolvePromise(Buffer.concat(chunks).toString("utf8")));
			res.on("error", reject);
		}).on("error", reject);
	});
}

const webRoot = import.meta.dir;

describe("web", () => {
	describe("resolveStaticPath", () => {
		it("Should map / to index.html under the root", () => {
			expect(resolveStaticPath(webRoot, "/")).toBe(join(webRoot, "index.html"));
		});

		it("Should resolve a plain file under the root", () => {
			expect(resolveStaticPath(webRoot, "/style.css")).toBe(join(webRoot, "style.css"));
		});

		it("Should refuse a path that escapes the root via ../..", () => {
			expect(resolveStaticPath(webRoot, "/../../etc/passwd")).toBeNull();
		});

		it("Should refuse a percent-encoded traversal attempt", () => {
			expect(resolveStaticPath(webRoot, "/%2e%2e/%2e%2e/etc/passwd")).toBeNull();
		});

		it("Should refuse an extension this dashboard does not serve, even inside the root", () => {
			// main.tsx is the source, not something the dashboard means to hand out - only its
			// bundled /main.js (served separately, see newDashboardFallback) is.
			expect(resolveStaticPath(webRoot, "/main.tsx")).toBeNull();
		});

		it("Should refuse a malformed percent-encoding rather than throw", () => {
			expect(resolveStaticPath(webRoot, "/%")).toBeNull();
		});

		it("Should refuse a doubled leading slash, which node:path's resolve() would otherwise treat as absolute", () => {
			// path.resolve(root, "/etc/passwd") discards `root` entirely and returns "/etc/passwd" -
			// the containment check after resolve() is what catches this, not the join itself.
			expect(resolveStaticPath(webRoot, "//etc/passwd")).toBeNull();
			expect(resolveStaticPath(webRoot, "/%2Fetc%2Fpasswd")).toBeNull();
		});
	});

	describe("bundleMain", () => {
		it("Should bundle main.tsx into self-contained browser JS", async () => {
			const js = await bundleMain(webRoot);
			expect(js.length).toBeGreaterThan(0);
			expect(js).toContain("createGrpcWebTransport");
		});
	});

	describe("scanClassCandidates", () => {
		// Prose comments contain apostrophes, and a scanner that pairs quote characters across
		// the whole file reads "panel's ... \"" as one literal and treats every class list after
		// it as comment. Nothing errors - the page just loses its styles from that point down,
		// which is the kind of failure that ships. This pins the comment-skipping so it cannot
		// regress back into quote counting.
		it("Should still find classes that follow a comment containing an apostrophe", async () => {
			const dir = await mkdtemp(join(tmpdir(), "raven-scan-"));
			await writeFile(
				join(dir, "Panel.tsx"),
				[
					"// Split from the panel's background, which is the comment that used to break this.",
					'const CLASS = "text-[17px] border-(--control-border)";',
				].join("\n"),
			);

			const candidates = await scanClassCandidates(dir);

			expect(candidates).toContain("text-[17px]");
			expect(candidates).toContain("border-(--control-border)");
		});

		it("Should not mistake a comment's own words for class candidates", async () => {
			const dir = await mkdtemp(join(tmpdir(), "raven-scan-"));
			await writeFile(join(dir, "Panel.tsx"), '/* hidden flex */\nconst CLASS = "block";');

			const candidates = await scanClassCandidates(dir);

			expect(candidates).toContain("block");
			expect(candidates).not.toContain("hidden");
			expect(candidates).not.toContain("flex");
		});
	});

	describe("bundleCss", () => {
		it("Should compile style.css instead of passing it through unchanged", async () => {
			const source = await readFile(join(webRoot, "style.css"), "utf8");
			const css = await bundleCss(webRoot);
			expect(css).not.toBe(source);
			// Only present because it was compiled from the dashboard's own scanned classes, not
			// copied from style.css's hand-written rules - a passthrough could not produce it.
			expect(css).toContain(".rounded-full");
		});
	});

	describe("newDashboardFallback", () => {
		it("Should serve generated CSS rather than the file on disk at /style.css", async () => {
			// The trap this test guards against: resolveStaticPath's CONTENT_TYPES allowlist
			// still permits .css from disk, so a fallback that forgot to intercept /style.css
			// before calling it would silently serve the uncompiled source instead - a stale
			// on-disk file shadowing the compiled one, which reads like a caching bug.
			const generatedCss = await bundleCss(webRoot);
			const server = createServer(newDashboardFallback({ webRoot, bundleJs: "", bundleCss: generatedCss }));
			await new Promise<void>((resolvePromise, reject) => {
				server.once("error", reject);
				server.listen(0, "127.0.0.1", () => resolvePromise());
			});

			try {
				const address = server.address();
				if (address === null || typeof address === "string") throw new Error("expected a bound TCP address");
				const body = await getBody(`http://127.0.0.1:${address.port}/style.css`);
				expect(body).toBe(generatedCss);
				expect(body).not.toBe(await readFile(join(webRoot, "style.css"), "utf8"));
			} finally {
				await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
			}
		});
	});
});
