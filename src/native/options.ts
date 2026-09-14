export type Options = {
	/** Directory holding libRavenNative.dylib, i.e. `dirname(PATHS.VIEWS_FOLDER)/native`. */
	nativeDir: string;
	/** Directory holding libElectrobunCore.dylib - the app's `Contents/MacOS`. */
	runtimeDir: string;
};
