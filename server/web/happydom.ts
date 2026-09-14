import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Bun preloads this before any test file's imports run (see bunfig.toml), which is required:
// @testing-library/dom's `screen` binds to `document` at import time, so registering happy-dom
// from inside a test's `beforeAll` is too late.
GlobalRegistrator.register();
