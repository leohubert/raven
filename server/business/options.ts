export type Options = {
	/** Injected so tests are deterministic, mirroring src/business/options.ts's `random`. */
	now: () => Date;
};
