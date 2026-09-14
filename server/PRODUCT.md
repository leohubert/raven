# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One operator — the repo's author — driving one to three of their own machines. There is no
second audience: no end user of the dashboard other than the person who installed the client,
and no handover to someone who has not read the code.

The situation is post-hoc, not live: raven's client is installed on a machine whose owner
walked away, and the operator opens the dashboard from elsewhere to decide what that machine
does and when. The job is *pick a machine, arm or disarm it, or fire a one-shot at it, and see
what actually happened* — not to monitor a fleet.

## Product Purpose

raven is an invisible, click-through overlay across every display that reacts to typing: each
keystroke plays a sound and sprays image sprites from the mouse cursor. This server turns that
standalone local overlay into a client/server system, and this dashboard is its control surface.

It exists because the standalone version had two failures: the joke fired before anyone was
watching, and there was no way to act on a machine once you had walked away from it. Success is
an operator who can leave a dormant client on a machine and later choose the moment.

## Positioning

The client is **dormant by default** and dormancy is mechanical, not polite: passive mode is the
*absence* of Carbon hotkey registration, because a registered hotkey consumes the keystroke
system-wide and would leave the machine's owner unable to type. An armed client and a passive
one are therefore genuinely different states of the machine, not a flag the dashboard sets.

One-shots (`PlaySound`, `BurstKey`) bypass key capture entirely and work while passive — the
operator can act on a machine without ever taking its keyboard.

## Operating Context

- The server runs two listeners on purpose: client control (gRPC bidi over h2c) on
  `CONTROL_PORT`, admin + dashboard (HTTP/1.1, gRPC-Web) on `ADMIN_PORT`. A browser will not
  speak HTTP/2 to `http://localhost` without TLS, and bidi requires HTTP/2.
- The dashboard is served by the server itself at `http://localhost:ADMIN_PORT`, and opened in
  an ordinary desktop browser.
- `WatchClients` server-streams a full roster snapshot on every pool change; the dashboard is
  always live and never polls or refreshes.
- Clients appear and vanish with their stream. Identity is ephemeral: a client that restarts is
  a new client id.
- Themes pushable to a client are enumerated server-side from `assets/themes/`.

## Capabilities and Constraints

Per-client actions, all five shipped: Activate (with a theme), Deactivate, PlaySound (theme +
relative path), BurstKey (one character), PushTheme.

- **The roster must show acked state, never commanded state.** `SendCommand` returning
  `accepted` means the pool queued the command, not that the client obeyed it. Only the client's
  own `StateChanged`, arriving via the next `WatchClients` push, may change what a badge says. A
  dashboard that shows ACTIVE for a client that failed to activate leads the operator to act on
  a machine they believe is armed and is not. Server-side this is pinned by
  `server/business/pool.test.ts`; client-side by never re-badging in `sendCommand`.
- A roster push must never destroy a panel the operator is mid-interaction with — panels are
  keyed by client id, so an open `<select>` or a half-typed `<input>` survives churn in any
  other panel.
- The dashboard is React 19 + Tailwind v4, still bundled from memory at server boot (JS by
  `Bun.build`, CSS by Tailwind's programmatic `compile()` export) and served with no build
  pipeline and no committed `dist/`; `@connectrpc/connect-web` speaks gRPC-Web. **The no-framework
  rule the approved spec recorded was reversed on 2026-09-14**: the panel-scoped renderer in the
  old `main.ts` had grown into a hand-rolled reconciler (keyed diff, id→node map, in-place fact
  patching) whose only purpose was to protect the mid-interaction invariant above — a guarantee a
  React `key` now provides for free. See
  `docs/superpowers/plans/2026-09-14-dashboard-react-tailwind.md`.
- The client is macOS-only (Carbon hotkeys, an ObjC dylib). Windows and Linux clients are out of
  scope.
- Pushed themes are never written to disk: bytes travel through the main process to the webview
  as blob URLs, because the webview loads assets only via `views://` from a path fixed at build
  time inside a read-only signed bundle.

**Explicitly undecided:** topology. Today it is localhost-only, with authentication, TLS, stable
client identity across restarts, and multiple concurrent admins all deliberately deferred. LAN
exposure is expected next and hosting is possible, so future design must not assume a single
trusted operator is permanent — but nothing about auth or multi-admin has been decided, and none
of it may be invented.

## Brand Commitments

The name is lowercase `raven`, everywhere, including the dashboard's own title. There is a
`icon.svg` / `icon.iconset` pair at the repo root used for the desktop client.

Voice in the shipped interface is flat and operational — `connecting…`, `PASSIVE`, `sending…` —
never jokey, even though the product is a prank. The operator is reading state they may act on.

## Evidence on Hand

- `docs/superpowers/specs/2026-09-11-raven-remote-control-design.md` — the approved design, and
  the source of the decisions recorded above.
- `AGENTS.md` — hard-won platform facts (permissions, Carbon hotkeys, `views://` asset serving,
  signing/notarization) and the Step 0 spike results.
- The dashboard exists and works: `server/web/{index.html,App.tsx,style.css}`, roster grid with
  one card per client.
- No testimonials, users, benchmarks, pricing, or deployment story exist. There is no marketing
  surface and none of this may be fabricated.

## Product Principles

1. **Dormant until told otherwise.** The default state takes nothing from the machine's owner.
2. **Report reality, not intent.** Every piece of state the operator reads is something a client
   confirmed, not something the server asked for.
3. **The operator's hands are never interrupted.** Live data updates around an interaction, not
   through it.
4. **One machine at a time.** The roster is small and the act is deliberate; this is not a fleet
   console.
5. **Match the repo's conventions over taste.** `newX(opts)`, no classes, one file per method with
   a `.test.ts` sibling, and no framework — except the dashboard, a documented, scoped exception
   (see *Capabilities and Constraints*).

## Accessibility & Inclusion

No product-specific requirement has been established beyond what the shipped dashboard already
does: `role="status"` with `aria-live` on the connection indicator, `role="alert"` on the themes
notice, a labelled roster list, and a visible `:focus-visible` outline.
