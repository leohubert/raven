# Dashboard — React + Tailwind migration plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `server/web/` from hand-written DOM to React 19 + Tailwind v4, with no change to what the dashboard does, shows, or guarantees.

**Why now:** `server/web/main.ts` has already built a worse React by hand. `diffClientIds` is keyed
reconciliation; `renderedPanels` is a fiber map; `panelState` is component state lifted into a
module-level `Map` keyed by client id; `previousLi.after()` is DOM reordering; `updatePanelFacts`
is a targeted commit phase. That machinery exists to protect one invariant — *a roster push must
never destroy a panel the operator is mid-interaction with* — and under React that invariant is
`key={client.clientId}`, enforced by the runtime instead of by four cooperating functions and
five explanatory comments.

**Not a redesign.** Same features, same copy, same layout, same visual result. A redesign, if
wanted, is a separate pass on top of this one.

**Tech Stack:** Bun 1.4.2, React 19.3, Tailwind v4.3, TypeScript. No build pipeline — `bundleMain`
keeps bundling at server boot and serving from memory.

**Spec:** `docs/superpowers/specs/2026-09-11-raven-remote-control-design.md` — **stale on one
point.** It reads "plain TS bundled by Bun — no framework ... an internal admin panel does not
justify introducing one." That was true when the dashboard was a table; it stopped being true
once the panel-scoped renderer was written. Task 6 annotates the spec rather than rewriting
history.

**Product record:** `server/PRODUCT.md` — its "No framework" bullet under *Capabilities and
Constraints* is superseded by this plan and is corrected in Task 6.

## Global Constraints

- **Never commit, never push, never open a PR.** The user's CLAUDE.md forbids it without an
  explicit per-message request. Every task ends with a **stop-and-report** checkpoint instead.
- Verification command for every task: `task check` (= `tsc --noEmit` + `bun test`).
- Test shape: `describe('<layer>') > describe('<method>') > it('Should ...')`, golden path first.
  Tests encode **why** the behaviour matters, not just what it does.
- Conventions: `newX(opts: Options)`, no classes, no DI container. Comments explain **why**, never
  **what**, and are not added per function.
- `tsconfig.json` has `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` and
  `verbatimModuleSyntax` on. Type-only imports must use `import type`.
- **The two load-bearing invariants survive every task, or the task is not done:**
  1. The badge reflects **acked** state, never commanded state. `SendCommand` returning
     `accepted` means queued, not obeyed. Only a `WatchClients` push may change a badge.
  2. A roster push never destroys a panel mid-interaction — an open `<select>` or a half-typed
     `<input>` in any panel survives churn in any other panel.
- Server-side behaviour, the proto contract, and `server/business/` are untouched by this plan.

---

### Task 0: Spike — how does Tailwind v4 compile inside `Bun.build`?

**This task is a gate. Its output is an answer, not code you keep.** It mirrors the Task 0 spike
that opened the remote-control work, and the verdict is recorded the same way.

The risk: `bun-plugin-tailwind` is first-party (Jarred Sumner, Zack Radisic) but was last
published 11 months ago at `0.1.2`, while Tailwind ships `4.3.3`. If the plugin bundles a pinned,
older oxide binary, it may not compile current Tailwind syntax.

**Files:**
- Create: `scripts/spike-tailwind.ts` (throwaway — delete after recording the result)
- Modify: `AGENTS.md` (record the verdict in the existing spike-result style)

- [ ] **Step 1: Try the plugin path**

```bash
bun add -d bun-plugin-tailwind tailwindcss
```

Build a one-file scratch CSS entry containing `@import "tailwindcss";` plus an `@theme` block,
through `Bun.build({ plugins: [tailwind] })`, and assert the output contains the generated
utility for a class used in a scratch TSX file.

- [ ] **Step 2: If the plugin lags, try the in-process compiler**

Tailwind v4 exposes a programmatic compiler from the `tailwindcss` package. Compile the same
entry in-process and return the CSS as a string. This needs no plugin, no subprocess, and no
version coupling — and it is symmetric with `bundleMain`, which already returns a bundled string
served from memory.

- [ ] **Step 3: Record the verdict**

Write the outcome into `AGENTS.md` alongside the existing spike tables: which mechanism compiles
Tailwind v4.3 under Bun 1.4.2, and the pinned version it was verified against.

**Gate:** Pass on either path → continue. Both fail → stop and report; do not fall back to a
committed `dist/` CSS or a separate watch process without the user's decision, because that
discards the "no build pipeline" property the spec chose deliberately.

**Verify:** the spike prints generated CSS for a class that appears only in the scratch TSX.

**STOP AND REPORT.**

---

### Task 1: React under the roster — deps, shell, and a read-only panel

Absorbs the former Task 2 (pre-flight rulings R1, R2, R6). React becomes the sole owner of the
roster container in this task; at no point does React share a DOM container with hand-written
DOM, because that shared ownership is the bug class this migration exists to delete.

**Files:**
- Create: `server/web/App.tsx`, `server/web/ClientPanel.tsx`, `server/web/useRoster.ts`
- Modify: `package.json`, `tsconfig.json`, `server/web/index.html`, `server/web/static.ts`
- Rename: `server/web/main.ts` → `server/web/main.tsx`

- [ ] **Step 1: Dependencies and JSX**

```bash
bun add react react-dom
bun add -d @types/react @types/react-dom
```

Set `"jsx": "react-jsx"` in `tsconfig.json`. Bun transpiles TSX natively, so `Bun.build` needs no
JSX configuration of its own.

**`bundleMain` in `server/web/static.ts` hardcodes `resolve(webRoot, "main.ts")`** — update it to
`main.tsx` as part of this task. Its error strings name `server/web/main.ts` too. Missing this
means the server boots and fails to bundle.

- [ ] **Step 2: Move the transport into a hook**

`useRoster()` owns the `watchClients` reconnect loop currently at the bottom of `main.ts` —
including the backoff, which is load-bearing: without it the page goes quietly stale, showing a
roster it can no longer confirm. Keep `MIN_BACKOFF_MS = 1000`, `MAX_BACKOFF_MS = 15_000`, and the
status strings verbatim (`connecting…`, `live`, `disconnected, retrying in Ns`). It returns
`{ clients, status }`.

The loop must stop on unmount; a `for await` that outlives the component would reconnect forever
against a dead tree. `loadPushableThemes` moves here too, exposing `{ themes, themesError }`.

- [ ] **Step 3: `App` and a read-only `ClientPanel`**

`App.tsx` renders the header, the status pill, the themes notice, and the roster `<ul>` —
including the empty state (`No clients connected. Start a raven client and it will appear
here.`).

`ClientPanel.tsx` in this task renders identity and facts ONLY: hostname (or `unnamed host`), the
short id + connected timestamp meta line with the full id as `title`, the state badge, and the
`<dl>` of Theme / Displays / Available. **No action controls yet** — those are Task 3.

`key={client.clientId}` on the panel. That key IS the mid-interaction invariant, replacing
`diffClientIds` + `renderedPanels` + `updatePanelFacts`.

Keep every formatter's output identical: `shortId` (12 chars + `…`), `formatDisplays`
(`W×H@Sx` joined by ` · `, `—` when empty), `formatConnectedAt` (`toLocaleString`), and the `—`
fallbacks for theme and themes.

- [ ] **Step 4: Badge honesty, from the start**

`setBadge` becomes a derivation from `client.state` in the render. `ACTIVE` / `PASSIVE` /
`UNKNOWN`, class `badge badge-<lowercased>`. Because Task 3 adds the only code that could ever
break this, add the test now, in `server/web/ClientPanel.test.tsx`:

```bash
bun add -d @happy-dom/global-registrator @testing-library/react @testing-library/dom
```

- *Should render the state the client reported, not one the operator asked for* — render a panel
  with `ClientState.PASSIVE`, assert the badge reads `PASSIVE`; re-render with `ACTIVE` and assert
  it follows. The badge has exactly one input, and this is what pins it there before Task 3 adds
  a second candidate input.

- [ ] **Step 5: The shell wiring**

`main.tsx` mounts `App` into a root node in `index.html`. `index.html` keeps its `<link
rel="stylesheet" href="/style.css">` and its `<script type="module" src="/main.js">` — the served
paths do not change. `style.css` is NOT touched in this task.

The vanilla panel code deleted by this task's rename is the code Task 3 finishes removing; delete
what `main.tsx` no longer uses, and leave `roster.ts` alone (Task 3 owns it).

**Verify:** `task check` green; `task server` boots; the dashboard lists connected clients with
correct facts and badges; the status pill still goes `connecting…` → `live` and still reconnects
with backoff when the server is killed and restarted.

**STOP AND REPORT.**

---

### Task 2: MERGED INTO TASK 1

Pre-flight ruling R6. The former Task 2 required React and imperative DOM to co-own the roster
`<ul>` for the length of one task. No dispatch. Numbering below is unchanged so brief extraction
stays stable.

---

### Task 3: Port the client panel, and delete the reconciler

The substance of the migration.

**Files:**
- Create: `server/web/actions.ts`
- Modify: `server/web/ClientPanel.tsx`, `server/web/ClientPanel.test.tsx`, `server/web/App.tsx`
- Delete: `server/web/roster.ts`, `server/web/roster.test.ts`

Task 1 already created `ClientPanel` as a read-only facts panel with `key={client.clientId}` and
the badge derivation. This task adds the action controls to it.

- [ ] **Step 1: Action controls and panel state**

`panelState` becomes ordinary `useState` inside `ClientPanel` — `activateTheme`, `playTheme`, `playRel`, `burstChar`, `pushTheme`, `pending`,
`feedback`. The `Map` keyed by client id disappears, and with it the need to delete entries when
a client leaves.

Keep the `<fieldset>`/`<legend>` grouping — it is a real grouping for assistive technology, not a
visual one — and keep every `aria-label`, the `role="status"`/`aria-live="polite"` feedback
region, and the `role="alert"` notice.

- [ ] **Step 2: Keep the badge honest**

Task 1 already derived the badge from `client.state` and pinned it with a test. This task adds
`sendCommand`, the first code that could ever break that. `sendCommand` sets `feedback` and
`pending` only, and must have no path to the badge. Keep the comment explaining why — it is a
*why*, and the one a future edit is most likely to break.

- [ ] **Step 3: Delete the hand-rolled reconciler**

`renderRoster`, `createPanel`, `updatePanelFacts`, `updatePanelActionState`, `refreshThemeOptions`,
`buildActions`, `populateSelect`, `themeSelect`, `textInput`, `actionButton`, `controlRow`,
`actionGroup`, `appendFact`, `RenderedPanel`, `renderedPanels`, `emptyEl`, and `diffClientIds`
all go. The entrance animation (`client-enter`, dropped on `animationend` so a reorder does not
replay it) is preserved as a CSS class on the panel root.

- [ ] **Step 4: Replace the deleted test's guarantee, do not just drop it**

`roster.test.ts` tested `diffClientIds`. Deleting it without replacing what it protected would
leave invariant 2 untested. Add a DOM test that encodes the *reason* the reconciler existed:

Task 1 added `@happy-dom/global-registrator`, `@testing-library/react` and
`@testing-library/dom`; add `@testing-library/user-event` for the typing test.

Extend `server/web/ClientPanel.test.tsx`:
- *Should keep a half-typed sound path when another client's state changes* — type into panel A's
  `rel` input, push a roster update in which only client B's state differs, assert panel A's input
  still holds the typed value. This is the failure the panel-scoped renderer was written to fix.
- *Should show the acked state, not the commanded one* — click Activate, resolve `SendCommand`
  with `accepted: true`, assert the badge still reads `PASSIVE` until a roster push says otherwise.
  This is the operator-safety invariant: a badge that reads ACTIVE for a client that failed to
  activate leads someone to act on a machine they believe is armed and is not.

Both tests fail if the invariant is removed, which `diffClientIds`'s unit test could not do — it
passed whether or not anything used it correctly.

**Verify:** `task check` green. Manual: with two clients connected, type into one panel's `rel`
field and activate the other; the typed value survives.

**STOP AND REPORT.**

---

### Task 4: Tailwind

Only now, with the DOM stable and tested, does the styling move.

**Files:**
- Modify: `server/web/style.css`, `server/web/static.ts`, `server/web/static.test.ts`, all `.tsx`

Absorbs CSS-from-memory from the former Task 1 (pre-flight ruling R1): Tailwind's compiler only
has something to do once `style.css` actually imports Tailwind, which happens here.

- [ ] **Step 0: Compile CSS at boot, serve it from memory**

Add `bundleCss(webRoot)` beside `bundleMain` in `server/web/static.ts`, using whichever mechanism
Task 0's spike settled on (read its verdict in `AGENTS.md`), and serve the result at `/style.css`
from memory the way `/main.js` already is.

`resolveStaticPath`'s `CONTENT_TYPES` allowlist currently permits `.css` from disk, so
`/style.css` must be intercepted BEFORE `resolveStaticPath` — exactly as `/main.js` is — or the
uncompiled source file is served in its place.

Add to `server/web/static.test.ts`: *Should serve generated CSS rather than the file on disk* —
because a stale on-disk `style.css` shadowing the compiled one is silent and would present as a
caching bug.

- [ ] **Step 1: Tokens first**

`style.css` becomes `@import "tailwindcss";` plus an `@theme` block. The existing custom
properties move across **unchanged** — `--bg`, `--fg`, `--muted`, `--border`, `--surface`,
`--selection`, `--active`, `--active-bg`, `--passive-bg`, `--error`, `--error-bg`, and the
`--s1..--s8` scale. Tailwind v4 reads `@theme` custom properties directly, so this is a move, not
a re-authoring, and no colour or spacing value changes.

- [ ] **Step 2: Carry the reasoning across, not just the declarations**

Two comments in `style.css` explain decisions the class names cannot:
- the `--s1..--s8` note on why tight steps bind a label to its value and generous steps separate
  reading from acting;
- the `min(26rem, 100%)` note on the roster grid track, which exists to stop the horizontal
  scroll the layout was built to remove.

Both survive, attached to the `@theme` block and to the roster container respectively. A utility
string cannot hold them, which is the main thing Tailwind costs here.

- [ ] **Step 3: Convert, component by component**

Port one component's rules at a time, checking the rendered result against the current dashboard
before moving on. Keep `:focus-visible`, `::selection`, `color-scheme`, `scrollbar-color`, and the
`client-enter` keyframes as base-layer CSS — they are not utility-shaped.

**Verify:** `task check` green, and the dashboard is visually indistinguishable from before at
desktop and at a narrow width. Run the detector once when the port is complete:
`impeccable detect --json server/web/index.html`.

**STOP AND REPORT.**

---

### Task 5: Reconcile the record

**Files:**
- Modify: `server/PRODUCT.md`, `docs/superpowers/specs/2026-09-11-raven-remote-control-design.md`, `AGENTS.md`

- [ ] **Step 1: Correct PRODUCT.md**

Replace the "No framework" bullet under *Capabilities and Constraints* with what is now true:
React 19 + Tailwind v4, bundled at server boot by `Bun.build`, still with no build pipeline and no
committed `dist/`. Record **why** it changed — the hand-rolled reconciler — so the decision does
not read as fashion to whoever finds it next.

Invariant 2's wording changes too: it is no longer "panels are updated in place, never recreated"
but "panels are keyed by client id", which is the same guarantee with a cheaper enforcement.

- [ ] **Step 2: Annotate, do not rewrite, the spec**

Add a dated note under the Dashboard section recording that the no-framework decision was
reversed, and why. The spec is a record of what was approved on 2026-09-11; editing it to look
prescient destroys that.

- [ ] **Step 3: `AGENTS.md`**

Update the `server/web/` line in the layer map, and confirm the Task 0 spike verdict is recorded.

**Verify:** `task check` green. No document contradicts another on the framework question.

**STOP AND REPORT.**

---

## Success criteria

- `task check` green at every checkpoint.
- The dashboard is visually and behaviourally indistinguishable from the current one.
- Both invariants hold, and both are now covered by tests that fail when the behaviour regresses.
- `server/web/` contains no hand-rolled reconciliation: no id→node map, no manual diff, no
  in-place fact patching.
- No build pipeline, no committed `dist/`, no separate watch process.

## Out of scope, deliberately

Visual redesign, dark mode, any change to `server/business/` or the proto contract, routing or
multi-page structure, and state management beyond `useState` — the roster is a handful of clients
and anything more would be premature.
