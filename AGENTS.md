# raven — agent & contributor notes

An invisible, click-through overlay across every display that reacts to what you type:
each keystroke plays a sound and sprays image sprites from the mouse cursor.

Rebuild of `github.com/leohubert/raven` (Electron 25) on Electrobun v2 + Bun/TypeScript,
laid out the way Bodyguard services are.

## Layers

```
src/bin/         wiring - _bootstrap.ts is the ONLY DI site; app.ts is the runnable
src/business/    all logic, the port - one file per method + .test.ts sibling
src/themes/      data layer - the assets/themes tree IS the schema, plus settings
src/input/       transport (driving) - Carbon hotkeys -> business.onKeyPressed
src/overlay/     transport - one window per display + typed webview RPC
src/native/      the only unsafe code - bun:ffi, behind one Native port
src/views/       the webview renderer, built by electrobun `build.views`
native/          raven_native.m - the ObjC shim, compiled by scripts/build-native.ts
```

Mirrors `~/projects/dashboard-api`: `src/bin/_bootstrap.ts` = `cmd/bootstrap.go`,
`src/business/` = `internal/business/`, `src/themes/` = `internal/database/`.
There is deliberately **no** `domain/`, `ports/`, `adapters/`, or `usecases/` - those names
appear nowhere in the Bodyguard fleet.

One keystroke, end to end:

```
Carbon hotkey (native/raven_native.m)
  -> src/input/index.ts        resolve the char, ask the overlay which display is under the cursor
  -> src/business/onKeyPressed pick a group, then a sound and images FROM THAT GROUP
  -> src/overlay/index.ts      rpc.send.burst to the one window under the cursor
  -> src/views/overlay/        play the clip, spawn sprites on the canvas
```

Rules: `newX(opts: Options)` everywhere, no classes, no DI container. Business methods are
`(deps, ctx, req)` and bound in `newBusiness` so callers see `(ctx, req)`. Derive types
(`type Business = ReturnType<typeof newBusiness>`). Event handlers use `on<Event>`; data
access is CRUD-shaped (`ListThemes`, `GetTheme`, `UpdateSettings`). Test helpers are named
`*.test.ts` so they stay out of the build. `describe('<layer>') > describe('<method>') >
it('Should ...')`, golden path first.

Deviations from the fleet, surfaced rather than shipped silently: no
`@bodyguard-ai/toolbox` (it is a Node/gRPC library and this is a Bun desktop app), so
there is no `errtb`/`logtb`/`envtb` - errors are plain classes in `src/business/error.ts`
and config is a single `loadEnv()` in `src/bin/env.ts`. Bun's test runner replaces
Mocha/Chai/Sinon.

## Picking what plays, and why it does not repeat

One keystroke picks a group, then a sound and images from that group
(`src/business/onKeyPressed.ts`). A group is one person's folder, and in the shipped theme
every one of them holds **exactly one sound** and one to three images.

That layout is the whole reason the anti-repeat lives where it does. The obvious place for
it - filtering recently played assets inside the chosen group - cannot work here: with a
single clip per person, the filter leaves nothing, the code falls back to the full pool and
replays that clip. Measured on the real theme before the fix: **12,3 % of keystrokes played
the same sound as the one before**, which is just P(drawing the same group twice) = 1/8.

So the history that matters is at the group level, in `pickGroup`:

```
remember   = min(GROUP_HISTORY_SIZE, usable.length - 1)   // 2, clamped for tiny themes
fresh      = usable.filter(g => !state.recentGroups.includes(g.name))
candidates = fresh.length > 0 ? fresh : usable
```

`GROUP_HISTORY_SIZE = 2` deliberately, not `HISTORY_SIZE`: remembering all but one group
would turn the draw into a tour de table. Two is enough to kill `A A` and `A B A` while
the order stays unpredictable and the spread even (~12,5 % per person over 10 000 presses).

`pickSound` and `pickImages` keep their own histories, same filter/fallback shape, capped
at `HISTORY_SIZE = 8` in `state.recentSounds` / `state.recentImages`. They are what handles
a fat group - a per-key directory with five clips, or a future theme with several sounds
per person - and they are near-no-ops on the current one. `pickImages` also splices its
picks out of a copied pool, up to `MAX_IMAGES_PER_BURST = 3`, so one burst never sprays the
same picture twice.

A per-key directory (`assets/themes/<theme>/a/`) short-circuits all of this: it wins
outright and is *not* recorded in the group history, because pressing `a` is supposed to
give the same joke every time.

Two properties that stay load-bearing:

**Exhaustion falls back, it never goes silent.** Every filter above has a
`fresh.length > 0 ? fresh : pool` escape, and `remember` is clamped to `usable.length - 1`
so a one-group theme still plays. The original raven instead reset its history and called
itself with no base case, so an image-only folder overflowed the stack. Here `pickSound`
returns `null` for a group with no sounds, and `onKeyPressed` returns `null` only when
there is neither a sound nor an image, letting the transport skip the round trip.

**The histories are global, not per group,** and are cleared by `loadTheme` - a theme
switch starts from a clean slate rather than banning the first few picks of the new theme.

Covered by `src/business/onKeyPressed.test.ts`: "Should not draw the same person twice in a
row", "Should not replay the clip it just played", "Should keep working once every clip has
been played recently".

## The flocs theme, and why it is generated rather than committed by hand

`assets/themes/flocs/` is the other shape a theme can take: one directory per **key**
instead of one per person, so pressing `é` says "é" in a Toad-ish voice rather than drawing
from a shared pool. It is the per-key short-circuit above used for every key at once, which
is why `global/floc/` still exists - it is the only group `pickGroup` can reach, and it
catches the keys that have no directory of their own.

The 55 clips and the mushroom sprite are built by `scripts/generate-flocs.ts`
(`task flocs`), offline: macOS `say` speaks the French name of the key, ffmpeg resamples it
up into Toad territory, ImageMagick draws the cap from primitives. The script is the source
of truth - the tree is deleted and rebuilt on every run, and `task flocs -- --voice sandy`
re-voices the whole theme in twenty seconds. `task flocs -- --preview <dir>` writes one
sample per voice preset instead, to pick from.

**The directory name is the typed character, which is what limits the coverage.** `scan.ts`
builds asset URLs by plain concatenation, so `"`, `^` and `<` come back percent-encoded from
the webview's URL parser; `:` is rewritten by Finder and the dmg packager; `/` cannot be a
directory name, and `.` resolves to the theme root. Those six fall through to the global
floc. The accented keys (`é è ç à ù ²`) *are* generated, and their URLs are the one thing
here that depends on the `views://` handler percent-decoding what the URL parser encoded -
if they ever go silent, that is the cause, and the fix is to encode every segment in
`collectAssets` rather than to drop the keys.

## Commands

```
bun run dev          # build + run with watch
bun run start        # run the last build
bun run build        # stable release build -> artifacts/
bun test             # unit tests
bun run typecheck
task flocs           # rebuild the flocs theme (needs ffmpeg + imagemagick)
```

## Toolchain

Electrobun 2.0.1, `mainProcess: "cottontail"`. The toolchain is **project-local**: every script
sets `HUTCH_HOME="$PWD/.hutch"`, so nothing is installed to `~` and `hutch` never lands on PATH.
`.hutch/` is gitignored (~92 MB, re-downloads on a fresh clone).

Verified: `ls ~/.hutch` -> absent, `which hutch` -> not found.

### Hard-won toolchain facts

- **`HUTCH_HOME` must be an ABSOLUTE path.** A relative value makes every
  `hutch electrobun <cmd>` fail with a bare, undiagnosable `error: FileNotFound`. This cost
  an hour. Hence `"$PWD/.hutch"` in package.json.
- **Never run `electrobun init`.** It is the only command that installs a machine-wide
  launcher, and it *appends a `PATH` export to your shell rc file* (it wrote to `~/.zshrc`
  here; reverted). `dev`/`build`/`run` only use the version-pinned cached archive.
- **Do not add `electrobun` to package.json dependencies.** v2 APIs come from the Hutch
  devkit; the npm package's module *throws* on import by design. Scripts use
  `bunx electrobun@2.0.1`, and the SDK resolves through `.hutch/devkit` via the `extends`
  in tsconfig.json.
- `hutch.config.ts` is required, and carries the `// @hutch cli=... cottontail=...` pragma.
- The app **must** be launched via `Contents/MacOS/launcher`. Running
  `./cottontail ../Resources/main.js` directly appears to work but SIGTRAPs on the first
  window creation — the launcher establishes bundle identity.

## Step 0 spike results (macOS 26.6.2, arm64, Electrobun 2.0.1) — ALL RESOLVED

| # | Unknown | Result |
|---|---|---|
| 1 | `bun:ffi` under Cottontail | **PASS** — `dlopen` works, `suffix = dylib`, `JSCallback` available |
| 2 | Reach the `NSWindow*` | **PASS** — `dlopen($cwd/libElectrobunCore.dylib).getWindowPointer(winId)`. cwd is `Contents/MacOS`, where the dylibs live |
| 3 | screensaver level / fullscreen-aux / no shadow / click-through | **PASS via a native shim** — `level = 1000`, `collectionBehavior = 337` (FullScreenAuxiliary+IgnoresCycle+Stationary+CanJoinAllSpaces) |
| 4 | Key capture | **GlobalShortcut works** (`Alt+P` registered, keyCode 35). `AXIsProcessTrusted = false` until the user grants Accessibility, so a `CGEventTap` needs that grant first |
| 5 | Asset protocol | **`views://` only** — see below |

### Why there is a `native/` dylib

AppKit refuses window *mutation* off the main thread and macOS traps hard on it. Reads are
tolerated, writes are not:

```
read  [window level] = 3      <-- fine
setLevel: 1000                <-- SIGTRAP, process dies
```

This is **not** an FFI signature problem — it reproduces with a single `objc_msgSend`
prototype — and it cannot be fixed with `JSCallback`: `threadsafe: true` marshals the call
back to the JS thread (defeating the point), and `threadsafe: false` would run JS off-thread.

So `native/raven_native.m` is a ~40-line ObjC shim that does the `dispatch_async(main_queue)`
hop *itself*, exposing plain C entry points. FFI then only ever calls something safe:

```
raven_set_window_level(win, 1000)
raven_set_overlay_collection_behavior(win)
raven_set_has_shadow(win, false)
raven_set_ignores_mouse_events(win, true)
raven_set_hidden_in_mission_control(win, true)
```

It compiles to 52 KB via the `scripts.preBuild` hook (`scripts/build-native.ts`), which
requires Xcode Command Line Tools. `scripts.preBuild` takes a **path to a script file** run by
Cottontail — not a shell command string.

Same main-thread rule applies to Electrobun's own API: **`Utils.isDockIconVisible()` SIGTRAPs**
(synchronous main-thread hop). `setDockIconVisible(false)` is fine. Avoid the sync `is*`
getters (`isAlwaysOnTop`, `isVisibleOnAllWorkspaces`, `isDockIconVisible`); set state, never
read it back.

### Serving theme assets to the webview

Only `views://` works, and only for paths physically under the view's own folder:

| URL | result |
|---|---|
| `views://spike/probe/dot.png` | **PASS** 8x8 |
| `views://spike/probe/beep.wav` | **PASS** duration 0.150 |
| `views://spike/assets/themes/probe/dot.png` | FAIL — `empty response for URL` |
| `appData://themes/probe/dot.png` | FAIL — onerror |
| `fetch("views://...")` | opaque status 0 — custom schemes are not fetchable |

So the theme tree must be `copy`-ed **into the view root** (`copy: { "assets/themes":
"views/overlay/themes" }`) and referenced as `views://overlay/themes/...`. Use `Image` and
`Audio` to load it, never `fetch`. `copy` destinations resolve under
`Contents/Resources/app/`, which is `dirname(PATHS.VIEWS_FOLDER)`.

## Size

Measured, not quoted:

| build | size |
|---|---|
| stable `.app` installed | **17 MB** (0.7 MB launcher + 16.3 MB self-extracting zstd payload) |
| stable `.dmg` / download | 17 MB / 16 MB |
| dev build, `mainProcess: cottontail` | 61 MB (55 MB runtime) |
| dev build, `mainProcess: bun` | 66 MB (63.5 MB runtime) |

Electrobun's advertised ~1.3 MiB is for a minimal native-process demo, **not** a Cottontail
TypeScript main process. 17 MB against Electron's ~120–150 MB is the real win.

## Environment notes

This machine has 3 displays, all `scaleFactor: 2` — which is why raven's hardcoded `×2` DPR
factor never looked broken here. Use `display.scaleFactor`.

## Permissions — why no shortcut fires

Measured on this machine:

```
bundleId=ai.bodyguard.raven path=.../build/dev-macos-arm64/raven-dev.app
Accessibility (AXIsProcessTrusted) : MISSING
Input Monitoring                   : DENIED
```

Electrobun's `GlobalShortcut` is `+[NSEvent addGlobalMonitorForEventsMatchingMask:NSEventMaskKeyDown]`
(`nativeWrapper.mm:9171`). A global NSEvent monitor **requires Input Monitoring**. Without it the
monitor is still created — `register()` returns `true` and logs `[GlobalShortcut] Registered:` —
but not one event ever arrives. Electrobun performs **no** permission check and shows **no**
prompt (no `AXIsProcessTrusted`, no `IOHIDCheckAccess` anywhere in its source), so it fails
totally silently. `native/raven_native.m` adds the checks Electrobun lacks; the harness prints
them at startup and refuses to pretend.

`Input Monitoring: DENIED` (status 1, not 2 = "not asked") means TCC has an explicit denial on
record, so `IOHIDRequestAccess` returns immediately without showing a dialog. It must be
granted by hand.

### Grants do not survive a rebuild

```
CodeDirectory flags=0x20002(adhoc,linker-signed)
Info.plist=not bound   Sealed Resources=none   TeamIdentifier=not set
security find-identity -v -p codesigning -> 0 valid identities found
```

The app is ad-hoc/linker-signed with no team identifier, so TCC keys the grant on the binary's
cdhash — which changes on **every** build. Granting `raven-dev.app` works until the next
`bun run dev`.

For the dev loop, grant **Input Monitoring + Accessibility to the terminal emulator** that
launches the app instead; TCC attributes a child process's event monitoring to the responsible
parent, and that grant survives rebuilds. For release, a real Developer ID (`mac.codesign` +
`mac.notarize`) is the actual fix — see Size/release notes.

### Solution: Carbon RegisterEventHotKey — no permission at all

Electron does **not** use an NSEvent monitor. `globalShortcut` is Carbon
`RegisterEventHotKey`, which requires no TCC grant *and consumes the keystroke*. That is both
why raven never prompted anyone and why it swallows your typing while it runs.

`native/raven_native.m` now implements the same thing, so we do not use Electrobun's
`GlobalShortcut` at all:

```
raven_hotkeys_init(callback)                       // InstallEventHandler, kEventHotKeyPressed
raven_register_hotkey(id, keyCode, carbonMods)     // RegisterEventHotKey; mods 0 = bare key
raven_unregister_hotkey(id) / raven_unregister_all_hotkeys()
raven_keycode_for_character("p")                   // layout-aware, see below
```

Carbon modifier masks: `cmdKey 0x0100`, `shiftKey 0x0200`, `optionKey 0x0800`,
`controlKey 0x1000`. Passing `0` registers a bare key — that is raven's core mechanic.

Verified with **both permissions absent**:

```
raven_hotkeys_init = true
  OPTION+P quit          : 'p' -> keyCode 35 registered
  OPTION+M click-through : 'm' -> keyCode 46 registered
  OPTION+B burst         : 'b' -> keyCode 11 registered
  bare J (raven mechanic): 'j' -> keyCode 38 registered
Accessibility=MISSING  InputMonitoring=DENIED
```

Carbon is deprecated but fully functional and is still what Chromium/Electron ship on macOS.
Build with `-framework Carbon -Wno-deprecated-declarations`.

### Fixing issue #2 properly: layout-aware key codes

`RegisterEventHotKey` takes **physical** virtual key codes, so hardcoding the QWERTY code for
`a` hits the `q` position on AZERTY — the exact cause of upstream issue #2.
`raven_keycode_for_character` resolves a character against the *live* layout via
`TISCopyCurrentKeyboardLayoutInputSource` + `UCKeyTranslate`, scanning key codes 0..127 for the
one that produces it. So we register "the key that types `p` on **this** keyboard", not a
QWERTY position. Returns -1 when the layout cannot produce the character unmodified.

Two bugs worth remembering here: `kUCKeyTranslateNoDeadKeysBit` is a bit *index*, not a mask —
use `kUCKeyTranslateNoDeadKeysMask` or dead keys stay enabled. And `FFIType.cstring` as an
*argument* needs a real pointer: pass `ptr(buffer)`, not the `Uint8Array` (doing the latter
SIGTRAPs inside `stringWithUTF8String:`).

### Consequence for key capture

Do **not** use Electrobun's `GlobalShortcut` (needs Input Monitoring, fails silently without
it) and do **not** use a `CGEventTap` (needs Accessibility). Use the Carbon path above: zero
permissions, keystrokes consumed exactly like the original, and layout-correct.

The cost is that Carbon hotkeys are per-key registrations, so raven still registers ~93 of them
— but each one is now resolved against the live layout instead of a QWERTY literal, which is
what actually fixes issue #2.

## Bugs found while verifying the harness

**1. Sprites drew off-screen: the canvas CSS box defaulted to its attribute size.**
`<canvas>` with `position:fixed;inset:0` but no `width`/`height` lays out at its *intrinsic*
(attribute) size. With a dpr=2 backing store that is twice the viewport, so everything drawn
landed outside the visible area:

```
canvas attr=3024x1964  cssRect=3024x1964  viewport=1512x982  dpr=2   <-- broken
canvas attr=5120x2880  cssRect=2560x1440  viewport=2560x1440 dpr=2   <-- fixed
```

Always set the CSS box explicitly (`width:100vw;height:100vh`) *and* the backing store
(`canvas.width = innerWidth * devicePixelRatio`), then
`ctx.setTransform(dpr,0,0,dpr,0,0)` so drawing happens in CSS pixels.

**2. `TIS*` / `UCKeyTranslate` / `LMGetKbdType` are not main-thread-safe.**
Resolving one character at a time from the JS thread worked twice and then SIGTRAPed —
classic latent thread bug. Replaced with `raven_layout_table_json()`, which dumps the whole
layout inside a single `dispatch_sync` to the main queue and caches it
(`raven_invalidate_layout_table()` to refresh after a layout change).

**3. A character maps to two physical keys — the naive map picks the wrong one.**
`.` is keyCode 47 (main row) *and* 65 (keypad); every digit is both 18..29 and 82..92.
`new Map(layout.map(e => [e.ch, e.code]))` keeps the **last** entry, silently binding the
numeric keypad. The table is ordered by ascending keyCode, so keep the **first** occurrence:

```ts
const codeFor = new Map<string, number>();
for (const e of layout) if (!codeFor.has(e.ch)) codeFor.set(e.ch, e.code);
```

**4. `executeJavascript` has no error channel.** It calls
`evaluateJavascriptWithNoCompletion`, so a typo or a missing global fails completely
silently. Use it only for diagnostics; the real overlay must use Electrobun RPC.

**5. A killed build leaves a stale lock and then lies.** After `kill`ing a dev run,
`electrobun build` prints `Waiting for the project build lock...` and later
`build complete` while producing an **empty** output directory. Recovery:

```
pkill -9 -f cottontail-build-helper; pkill -9 -f hutch-engine
rm -f .hutch/locks/electrobun-build.lock
rm -rf build/dev-macos-arm64 && bun run build
```

## Verified working (macOS 26.6.2)

- 3 overlays, one per display, `level=1000`, `collectionBehavior=337`, transparent, no shadow.
- Carbon hotkeys fire with **Accessibility MISSING and Input Monitoring DENIED**.
- A bare-key registration is captured **and swallowed system-wide** — raven's core mechanic,
  reproduced without any permission prompt. Note this bites during development: while the
  harness runs, that key disappears everywhere.
- Layout read live: 65 printable keys. This machine is QWERTY (`a:0 q:12 z:6`) on ISO
  hardware (`§:10`).
- `Utils.quit(0)` works, and `dev --watch` does **not** relaunch after a quit.

## CRITICAL: never use Electrobun's `passthrough` for an overlay

`passthrough: true` does **not** mean "click through this window". Electrobun implements it by
physically **parking the WKWebView off-screen** at `OFFSCREEN_OFFSET = -20000`
(`nativeWrapper.mm:105`) and moving it back only when the cursor is over an interactive
region — `setPassthrough:` re-evaluates the "active view" from the mouse position
(`nativeWrapper.mm:1339`). It is mouse-routing for stacked webviews, not a click-through flag.

The failure is maddening because *everything* looks correct. The window reports
`isVisible=1 alphaValue=1.0 occlusionVisible=1 isOnActiveSpace=1`, with the right frame and
level. The page fully loads, JS runs, `innerWidth`/`innerHeight` are correct, the canvas fills
with pixels (`nonTransparentPixels=71207`), and console output flows. Nothing is drawn on
screen, because the view it all lands in is 20,000 points away:

```
ContainerView   frame=[0, 0, 2560, 1440]
  WKWebView     frame=[-20000, -20000, 2560, 1440]   <-- passthrough: true
    WKFlippedView frame=[0, 0, 2560, 1440]
```

**Do this instead** — exactly what Electron's `setIgnoreMouseEvents` does:

```ts
new BrowserWindow({ transparent: true, passthrough: false, titleBarStyle: "hidden", ... })
raven_set_ignores_mouse_events(windowPtr, true)   // click-through at the WINDOW level
```

Result: `WKWebView frame=[0, 0, 2560, 1440]` and `ignoresMouseEvents=1` — visible *and*
click-through. `src/native/` owns this; `src/overlay/` must never pass `passthrough: true`.

Lesson for debugging this stack: when a window is provably visible and the page is provably
rendering but nothing appears, **dump the view tree** (`raven_view_tree_json`). Window-level
state is not enough.

## Showing over another app's fullscreen space

Setting `level=1000` and `collectionBehavior=337` is **not enough**. Since macOS 10.14,
`NSWindowCollectionBehaviorCanJoinAllSpaces` is silently ignored when
`NSWindowCollectionBehaviorFullScreenAuxiliary` is also set — unless the process is a
**UIElement application**. Electron works around this in
`NativeWindowMac::SetVisibleOnAllWorkspaces` with the Carbon `TransformProcessType` plus
`setCanHide:NO`, and notes it has to "functionally mimic app.dock.hide()".

Critically, `-[NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory]` — which is
what Electrobun's `Utils.setDockIconVisible(false)` calls — is **not equivalent** and does not
lift the restriction.

Order matters. Transform the process *before* configuring any overlay window:

```ts
raven_become_ui_element_app();          // TransformProcessType(kProcessTransformToUIElementApplication)
// then, per window:
raven_configure_overlay_window(ptr);    // setCanHide:NO, collectionBehavior, level 1000,
                                        // hasShadow:NO, ignoresMouseEvents:YES,
                                        // hiddenInMissionControl:YES, orderFrontRegardless
```

`raven_become_ui_element_app()` also hides the dock icon as a side effect, so
`Utils.setDockIconVisible(false)` is no longer called at all — it would fight the transform.

Verified state:

```
raven_become_ui_element_app = true
activationPolicy=Accessory   canHide=false
level=1000  collectionBehavior=337  WKWebView frame=[0,0,2560,1440]
```

## Signing and notarizing for distribution

`build.mac.codesign` / `notarize` flip themselves on when credentials are in the
environment (see the top of `electrobun.config.ts`), so a local build still works with no
Apple account. **Dev builds are never signed** — signing only runs for
`--env=canary` and `--env=stable`.

Hutch signs nested Mach-O files and code bundles *before* the outer app, so
`native/libRavenNative.dylib` is signed too, then verifies with `codesign`, submits app
and DMG, staples the ticket and validates it.

### One-time setup

1. Apple Developer Program membership, and a **Developer ID Application** certificate whose
   private key is in the login keychain (Xcode > Settings > Accounts > Manage Certificates).
2. Confirm macOS can see it:

```bash
security find-identity -v -p codesigning
# -> 1) ABC... "Developer ID Application: Bodyguard (AB12C3D4E5)"
```

3. Export the identity string exactly as printed:

```bash
export ELECTROBUN_DEVELOPER_ID="Developer ID Application: Bodyguard (AB12C3D4E5)"
```

### Notarization credentials — pick one

App Store Connect API key (preferred; create under Users and Access > Integrations):

```bash
export ELECTROBUN_APPLEAPIKEYPATH="$HOME/private_keys/AuthKey_ABC123DEFG.p8"
export ELECTROBUN_APPLEAPIKEY="ABC123DEFG"
export ELECTROBUN_APPLEAPIISSUER="01234567-89ab-cdef-0123-456789abcdef"
```

Or an Apple ID with an app-specific password (all three required):

```bash
export ELECTROBUN_APPLEID="leo.hubert@bodyguard.ai"
export ELECTROBUN_APPLEIDPASS="xxxx-xxxx-xxxx-xxxx"
export ELECTROBUN_TEAMID="AB12C3D4E5"
```

### Build and verify

```bash
bun run build                                  # --env=stable: sign + notarize + staple
ELECTROBUN_SKIP_NOTARIZATION=1 bun run build   # sign only, no submission to Apple

codesign -dv --verbose=4 build/stable-macos-arm64/raven.app
spctl -a -vvv build/stable-macos-arm64/raven.app     # want: accepted, Notarized Developer ID
xcrun stapler validate build/stable-macos-arm64/raven-stable.dmg
```

Entitlements: Electrobun already supplies the JIT and dynamic-library entitlements its
runtime needs. Add anything app-specific under `build.mac.entitlements` — raven needs none.

### Signing also fixes TCC grant churn

An ad-hoc build's cdhash changes every rebuild, so any Accessibility or Input Monitoring
grant is revoked each time (see the permissions section). A stable Developer ID identity
makes grants persist. Raven does not currently need either permission — Carbon hotkeys
require none — but this matters if that ever changes.
