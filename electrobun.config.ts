// Signing turns itself on when credentials are present, so a local build still works
// without an Apple account. Dev builds are never signed - only --env=canary/stable.
const developerId = process.env["ELECTROBUN_DEVELOPER_ID"];
const canSign = !!developerId;
const canNotarize =
	canSign &&
	(!!process.env["ELECTROBUN_APPLEAPIKEYPATH"] || !!process.env["ELECTROBUN_APPLEID"]);

export default {
	app: {
		name: "raven",
		identifier: "ai.bodyguard.raven",
		version: "1.0.0",
		description: "An overlay that reacts to everything you type.",
	},
	runtime: {
		// The overlays are the app; closing one must not take the process down.
		exitOnLastWindowClosed: false,
	},
	scripts: {
		// Compiles native/raven_native.m -> native/libRavenNative.dylib. Needs Xcode CLT.
		preBuild: "scripts/build-native.ts",
	},
	build: {
		mainProcess: "cottontail",
		cottontail: { entrypoint: "src/bin/app.ts" },
		views: {
			overlay: { entrypoint: "src/views/overlay/index.ts" },
		},
		copy: {
			"src/views/overlay/index.html": "views/overlay/index.html",
			// Theme assets must live under the view root: views:// is the only scheme the
			// webview can load from, and it only resolves paths inside the view's folder.
			"assets/themes": "views/overlay/themes",
			"native/libRavenNative.dylib": "native/libRavenNative.dylib",
		},
		mac: {
			bundleCEF: false,
			codesign: canSign,
			notarize: canNotarize,
			createDmg: true,
		},
		linux: { bundleCEF: false },
		win: { bundleCEF: false },
	},
};
