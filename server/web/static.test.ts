import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { bundleMain, resolveStaticPath } from "./static";

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
			// main.ts is the source, not something the dashboard means to hand out - only its
			// bundled /main.js (served separately, see newDashboardFallback) is.
			expect(resolveStaticPath(webRoot, "/main.ts")).toBeNull();
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
		it("Should bundle main.ts into self-contained browser JS", async () => {
			const js = await bundleMain(webRoot);
			expect(js.length).toBeGreaterThan(0);
			expect(js).toContain("createGrpcWebTransport");
		});
	});
});
