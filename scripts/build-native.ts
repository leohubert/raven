// preBuild hook: compile the macOS main-thread shim. Run by Cottontail via Hutch.
import { execFileSync } from "node:child_process";

if (process.platform !== "darwin") {
	console.log("[build-native] not darwin, skipping");
	process.exit(0);
}

const args = [
	"-dynamiclib",
	"-fobjc-arc",
	"-framework", "Cocoa",
	"-framework", "ApplicationServices",
	"-framework", "IOKit",
	"-framework", "Carbon",
	"-Wno-deprecated-declarations",
	"-mmacosx-version-min=14.0",
	"-o", "native/libRavenNative.dylib",
	"native/raven_native.m",
];
execFileSync("clang", args, { stdio: "inherit" });
console.log("[build-native] libRavenNative.dylib built");
