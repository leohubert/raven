# raven remote control — design

Turn raven from a standalone local overlay into a client/server system: a passive-by-default
client that dials a server, and a server that holds the pool of connected clients and drives
them individually from a web dashboard.

Status: approved design, not yet implemented. Scope is the first milestone only.

## Why

raven today is installed by hand on the machine of someone who forgot to lock it, and it
reacts immediately. Two problems with that: the joke fires before anyone is watching, and
there is no way to act on a machine once you have walked away from it.

The system below keeps the client **dormant** until told otherwise, and adds a control channel
so sounds, themes and activation can be driven remotely.

## Decisions taken

| Question | Decision |
|---|---|
| Topology | **localhost first** — server and client on one machine to build the spine. Real topology (LAN vs hosted), auth and TLS are deliberately out of scope. |
| Transport | **gRPC / Connect bidirectional streaming** over HTTP/2, one long-lived stream per client. Fallback is WebSocket carrying the same protobuf envelopes. |
| Admin GUI | **Web dashboard served by the server**, speaking gRPC-Web (unary + server-streaming). A browser cannot do bidi gRPC, hence a separate admin service. |
| Client default state | **Fully dormant.** Connected and listening, but no reaction to local typing. One-shot commands still work while passive. |
| First-milestone actions | Activate/Deactivate, PlaySound, Burst, PushTheme — all four. |

## Layout

Everything lives in the raven repo. The server is a second app that replays the client's
conventions (`newX(opts)`, no classes, no DI container, one bootstrap site).

```
proto/                      the shared contract, source of truth (buf)
  raven/control/v1/*.proto
  buf.yaml  buf.gen.yaml
src/gen/                    generated protobuf code

src/control/                NEW client-side transport layer
  index.ts                  opens the bidi stream, reconnect, keepalive
  onCommand.ts              routes one ServerToClient into business
  options.ts

server/
  bin/_bootstrap.ts         the ONLY DI site
  bin/app.ts                the runnable
  business/                 pool, roster, routing — one file per method + .test.ts sibling
  transport/                Connect impl: bidi for clients, unary/server-stream for admin
  web/                      the dashboard, plain TS bundled by Bun
```

`src/control/` is one more transport port alongside `src/input/` (Carbon) and `src/overlay/`
(webview RPC): it receives commands and calls into `business`, and `business` never learns
that a network exists.

## The contract

Two services, because a browser cannot open a bidirectional stream.

```proto
service RavenControl {                               // CLIENT channel (bidi, HTTP/2)
  rpc Connect(stream ClientToServer) returns (stream ServerToClient);
}

service RavenAdmin {                                 // DASHBOARD channel (gRPC-Web)
  rpc WatchClients(Empty) returns (stream Roster);
  rpc SendCommand(CommandRequest) returns (CommandResult);
  rpc ListPushableThemes(Empty) returns (ThemeList);
}

message ClientToServer {
  oneof msg { Hello hello; Pong pong; StateChanged state; ThemeList themes; Ack ack; }
}

message ServerToClient {
  oneof msg { Ping ping; Activate activate; Deactivate deactivate;
              PlaySound play; BurstKey burst; PushThemeChunk push; }
}
```

- `Hello` carries client identity: ephemeral id, hostname, displays, themes already present.
- `Activate{theme}` / `Deactivate` control state.
- `PlaySound{theme, rel}` and `BurstKey{character}` are one-shots.
- `PushThemeChunk{theme, rel, mime, seq, total, data}` transfers one file of a theme.
- `StateChanged` / `Ack` report back what the client actually did, so the roster reflects
  reality rather than intent.

`BurstKey` is deliberately not named `Burst`: `src/business/types.ts` already exports a `Burst`
type, and two `Burst` symbols in one file is how import bugs start.

## Client

### The state machine is hotkey registration

A Carbon hotkey **consumes the keystroke system-wide** (see AGENTS.md). So passive mode is not
"register the hotkeys and ignore them" — that would leave the machine's owner unable to type.
Passive mode is the absence of registration:

```
PASSIVE (default) --Activate(theme)--> ACTIVE --Deactivate--> PASSIVE
```

- **PASSIVE** — no hotkey registered, local typing is untouched and nothing is shown or heard.
  The control stream is connected and listening.
- **Activate{theme}** — `loadTheme(theme)`, then `input.Start()`. Local typing produces bursts.
- **Deactivate** — `input.Stop()`, which already calls `native.unregisterAllHotkeys()`. Back to
  passive, keyboard handed back.

`newInput` already exposes exactly `Start()` and `Stop()`, so this costs no new native code.
The only change to the existing runnable is that `src/bin/app.ts` stops calling `input.Start()`
at boot.

### One-shots bypass key capture entirely

`PlaySound` and `BurstKey` arrive from the server, go through `src/control/onCommand.ts` into
business (`onKeyPressed(char)` for `BurstKey`, a new `playAsset` for `PlaySound`), and out
through `overlay.SendBurst` to the window under the cursor. No hotkey is involved, so they work
while passive, and they add no new rendering path.

`BurstKey` reuses `onKeyPressed` untouched, so the anti-repeat histories documented in
AGENTS.md apply to remote bursts exactly as to local ones.

### PushTheme: the constraint that breaks the obvious approach

AGENTS.md is unambiguous: the webview loads assets **only** via `views://`, and **only** from
paths physically under the view's own folder inside the bundle — a path fixed at build time.
`appData://` fails, custom schemes are not fetchable, and a signed bundle is read-only.

**A theme pushed at runtime therefore cannot be written into the bundle nor served over
`views://`.** Bytes travel through the main process to the webview instead:

```
PushThemeChunk --gRPC--> main process (in-memory cache, key = sanitized path)
    --Electrobun RPC (bytes)--> webview: Blob -> URL.createObjectURL -> Image / Audio
```

This sidesteps `views://` and the read-only bundle, writes nothing to disk, and reuses the RPC
channel the overlay already depends on. The webview rewrites each `ThemeAsset.url` in the
received `Theme` to its blob URL, so a pushed asset and a bundled one are both just a URL
string handed to `Image`/`Audio` and the renderer does not distinguish them.

Electrobun's RPC is JSON-based, so bytes travel base64-encoded.

Every relative path is sanitized (no `..`, no absolute path) even though nothing is written to
disk, so the invariant still holds when disk persistence is added later.

Transfer is one message per file, closed by an `Ack`. The theme clips are small; finer chunking
is not warranted yet.

## Server

`server/business/`, same conventions as `src/business/`.

- **Pool** — `clientId -> { info, send, pending }`. A client is registered when its `Connect`
  stream opens and its `Hello` arrives, and removed when the stream closes. `Ping`/`Pong`
  keepalive drops dead streams.
- **Roster** — a derived view of the pool for the dashboard. `WatchClients` server-streams a
  full snapshot on every pool change. Snapshots, not deltas: a roster of office machines is
  tiny and deltas would be premature.
- **Routing** — `SendCommand{clientId, action}` looks up the client's sink, mints a command id,
  pushes the matching `ServerToClient`, and returns `CommandResult{accepted}`. The client's
  later `Ack`/`StateChanged` is what updates the roster.

The pool holds no network code: a connected client is an injected `ClientSink` callback, which
is what makes the whole thing unit-testable with a fake.

**The roster must show acked state, never commanded state.** A dashboard that shows ACTIVE for
a client that failed to activate leads an operator to act on a machine they believe is armed
and is not.

### Two listeners, on purpose

Control (gRPC bidi) is served over h2c on `CONTROL_PORT`; admin + dashboard over HTTP/1.1 on
`ADMIN_PORT`. A browser will not speak HTTP/2 to `http://localhost` without TLS, and bidi
requires HTTP/2 — one listener cannot serve both.

## Dashboard

Served at `http://localhost:ADMIN_PORT`, plain TS bundled by Bun — no framework. The repo's only
existing view is plain TS and a canvas, and an internal admin panel does not justify
introducing one.

`@connectrpc/connect-web` speaks gRPC-Web: `WatchClients` feeds a live table, each button calls
`SendCommand`. One row per client (id, hostname, displays, state, current theme, available
themes) with Activate (theme picker), Deactivate, PlaySound, BurstKey (character field) and
PushTheme.

The server enumerates what it can push by **reusing `src/themes/scan.ts`** via `newThemeStore`
against `assets/themes/` — that layer already is the schema of the theme tree, so the knowledge
is not duplicated. Its `assetBaseUrl` is `pushed://`, a placeholder the client replaces with
blob URLs.

## Plan

**Spike 0 — blocking, before any architecture is committed.** Stand up a Bun Connect server
with `rpc Connect(stream) returns (stream)` and a Bun client, exchange messages both ways over
localhost, and keep the stream open. The risk is the maturity of Bun's HTTP/2 server, which
bidi streaming requires.

- Pass: proceed as designed.
- Fail: fall back to WebSocket **without touching the `.proto` messages** — `ClientToServer`
  and `ServerToClient` are unchanged, only the service wrapper differs.

Either way the result is recorded in AGENTS.md alongside the existing Step 0 spike table.

Slices, in order:

1. Proto + buf codegen into `src/gen`.
2. Server: pool business logic.
3. Server: `Connect` transport, `Hello`/`Ping`/`Pong`, the runnable.
4. Client `src/control/`: connect, `Hello`, reconnect with backoff, passive by default.
5. Admin service: `WatchClients`, `SendCommand`, `ListPushableThemes`.
6. Dashboard, live roster.
7. One-shots: `PlaySound` + `BurstKey`. **The spine is complete here** — click a button, the
   client reacts.
8. `Activate`/`Deactivate` via hotkey registration.
9. `PushTheme`: chunked transfer and blob URLs.

## Testing

Tests encode why the behavior matters, in the existing
`describe('<layer>') > describe('<method>') > it('Should ...')` shape, golden path first.

`server/business/`:
- Should drop a client when its stream closes.
- Should refuse a command addressed to an unknown client.
- Should reflect the client's acked state, not the commanded one.

`src/control/`:
- Should not register hotkeys while passive — the load-bearing invariant; the alternative
  leaves the machine's owner unable to type.
- Should play a one-shot while passive.
- Should reject a pushed asset path that escapes its theme.

## Success criteria

- `task check` (typecheck + `bun test`) green.
- Manual run: server up, client launched, the dashboard lists it as `PASSIVE`; typing does
  nothing; a button plays a sound; `Activate` makes typing burst; `Deactivate` returns the
  keyboard intact; a pushed theme is playable.

## Out of scope, deliberately

Authentication and TLS (they follow from the deferred topology decision), disk persistence of
pushed themes, stable client identity across restarts, multiple concurrent admins, and
Windows/Linux clients. Each becomes tractable once the topology is chosen.
