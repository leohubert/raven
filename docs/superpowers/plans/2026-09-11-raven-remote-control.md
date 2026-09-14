# raven Remote Control — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn raven into a passive-by-default client driven remotely by a Bun server that holds a pool of connected clients and exposes a web dashboard to act on each one.

**Architecture:** One long-lived gRPC bidirectional stream per client (`RavenControl.Connect`), a separate gRPC-Web admin service for the browser dashboard (`RavenAdmin`), and a new client-side transport layer `src/control/` that routes server commands into the existing `business`/`input`/`overlay` layers. The client's passive/active state is exactly whether `input.Start()` has been called.

**Tech Stack:** Bun, TypeScript, Electrobun 2.0.1 (client only), protobuf-es v2 (`@bufbuild/protobuf`), Connect-ES v2 (`@connectrpc/connect`, `connect-node`, `connect-web`), buf CLI.

**Spec:** `docs/superpowers/specs/2026-09-11-raven-remote-control-design.md`

## Global Constraints

- **Never commit, never push, never open a PR.** The user's CLAUDE.md forbids it without an explicit per-message request. This overrides the writing-plans skill's default "Commit" step — every task ends with a **stop-and-report** checkpoint instead.
- `HUTCH_HOME` must be an **absolute** path; all client scripts already set `"$PWD/.hutch"`. Never run `electrobun init`. Never add `electrobun` to `package.json` dependencies.
- Verification command for every task: `task check` (= `tsc --noEmit` + `bun test`).
- Test shape: `describe('<layer>') > describe('<method>') > it('Should ...')`, golden path first. Test helpers are named `*.test.ts` so they stay out of the build.
- Conventions: `newX(opts: Options)`, no classes, no DI container. Business methods are `(deps, ctx, req)` bound in `newX` so callers see `(ctx, req)`. Derive types with `type X = ReturnType<typeof newX>`. Data access is CRUD-shaped (`ListClients`, `GetClient`); event handlers are `on<Event>`.
- `src/bin/_bootstrap.ts` is the **only** DI site on the client; `server/bin/_bootstrap.ts` is the only one on the server.
- Comments explain **why**, never **what**. Do not comment every function.
- Client and server both run on **localhost** for this milestone. No auth, no TLS — deliberately out of scope.
- `tsconfig.json` has `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` and `verbatimModuleSyntax` on. Type-only imports must use `import type`.

---

### Task 0: Spike — is Connect bidi streaming viable on Bun?

**This task is a gate. Its output is an answer, not code you keep.** Bidirectional streaming requires HTTP/2; the risk is the maturity of Bun's HTTP/2 *server*.

**Files:**
- Create: `scripts/spike-bidi.ts` (throwaway — delete after recording the result)
- Modify: `AGENTS.md` (record the verdict)

- [ ] **Step 1: Confirm the current Connect-ES API before writing code**

Use the Context7 MCP (`resolve-library-id` then `query-docs`) for `@connectrpc/connect-node`, asking specifically: how to serve a bidi-streaming method over h2c, and how to create a gRPC transport client. Connect-ES v2 generates service descriptors directly from `@bufbuild/protoc-gen-es` — `protoc-gen-connect-es` is no longer needed. Treat the code below as the target shape and correct it against the docs.

- [ ] **Step 2: Install the tooling and write a scratch proto**

```bash
bun add -d @bufbuild/buf @bufbuild/protoc-gen-es
bun add @bufbuild/protobuf @connectrpc/connect @connectrpc/connect-node
```

Write a two-message scratch proto with one bidi method, generate it, and use it from the spike. It can be the real `proto/raven/control/v1/control.proto` from Task 1 if you prefer — the spike only needs `Connect(stream ClientToServer) returns (stream ServerToClient)` to exist.

- [ ] **Step 3: Write the throwaway spike**

Server half — h2c on `127.0.0.1:8787`:

```ts
import { createServer } from "node:http2";
import { connectNodeAdapter } from "@connectrpc/connect-node";

const handler = connectNodeAdapter({
  routes: (router) => {
    router.service(RavenControl, {
      async *connect(reqs) {
        for await (const _req of reqs) {
          yield { msg: { case: "ping", value: { nonce: BigInt(Date.now()) } } };
        }
      },
    });
  },
});
createServer(handler).listen(8787);
```

Client half — sends 3, expects 3 back, holds the stream open through an idle gap:

```ts
import { createClient } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";

const client = createClient(
  RavenControl,
  createGrpcTransport({ baseUrl: "http://127.0.0.1:8787" }),
);

async function* outbound() {
  for (let i = 0; i < 3; i++) yield { msg: { case: "pong", value: { nonce: BigInt(i) } } };
  await new Promise((r) => setTimeout(r, 2000)); // prove the stream survives idle
}

let received = 0;
for await (const _ of client.connect(outbound())) received++;
console.log("received", received);
```

- [ ] **Step 4: Run it**

Run: `bun scripts/spike-bidi.ts`
Expected on PASS: `received 3`, both directions flowed, no crash, the stream stayed open through the 2s idle.

- [ ] **Step 5: Record the verdict in AGENTS.md**

Append a row to the existing spike table in `AGENTS.md`, in the same measured style as the Step 0 results ("PASS — …" / "FAIL — …", with the actual error text on failure).

- [ ] **Step 6: Branch the plan on the result**

- **PASS** → continue to Task 1 unchanged.
- **FAIL** → the `.proto` **messages do not change at all**. Only the service wrapper does: replace `RavenControl.Connect` with a Bun `WebSocket` server, and frame each message as `toBinary(ClientToServerSchema, msg)` / `fromBinary(ServerToClientSchema, bytes)` over `ws.send`. Tasks 2, 4, 7, 8 and 9 are unaffected because they never touch the wire directly. Rewrite only Task 3's transport and Task 4's dial logic, then continue.

- [ ] **Step 7: Delete the spike, stop and report**

Delete `scripts/spike-bidi.ts`. Report the verdict and which branch the plan is on. **Do not commit.**

---

### Task 1: The proto contract and codegen

**Files:**
- Create: `proto/buf.yaml`, `proto/buf.gen.yaml`, `proto/raven/control/v1/control.proto`
- Create (generated): `src/gen/raven/control/v1/control_pb.ts`
- Modify: `package.json` (devDependencies + a `proto` script), `Taskfile.yml` (a `proto` task), `AGENTS.md`

**Interfaces:**
- Produces: `ClientToServer`, `ServerToClient`, `Hello`, `Ping`, `Pong`, `StateChanged`, `ThemeList`, `Ack`, `Activate`, `Deactivate`, `PlaySound`, `BurstKey`, `PushThemeChunk`, `PushTheme`, `ClientInfo`, `Roster`, `CommandRequest`, `CommandResult`, `ClientState`, `Empty`, `Display`, plus the service descriptors `RavenControl` and `RavenAdmin`.

- [ ] **Step 1: Write `proto/buf.yaml`**

```yaml
version: v2
modules:
  - path: .
lint:
  use: [STANDARD]
breaking:
  use: [FILE]
```

- [ ] **Step 2: Write `proto/buf.gen.yaml`**

```yaml
version: v2
inputs:
  - directory: .
plugins:
  - local: protoc-gen-es
    out: ../src/gen
    opt:
      - target=ts
```

- [ ] **Step 3: Write `proto/raven/control/v1/control.proto`**

```proto
syntax = "proto3";
package raven.control.v1;

message Empty {}

message Display {
  int32 id = 1;
  int32 width = 2;
  int32 height = 3;
  double scale_factor = 4;
}

enum ClientState {
  CLIENT_STATE_UNSPECIFIED = 0;
  CLIENT_STATE_PASSIVE = 1;
  CLIENT_STATE_ACTIVE = 2;
}

message Hello {
  string client_id = 1;
  string hostname = 2;
  string version = 3;
  repeated Display displays = 4;
  repeated string themes = 5;
}

message Ping { int64 nonce = 1; }
message Pong { int64 nonce = 1; }
message StateChanged { ClientState state = 1; string theme = 2; }
message ThemeList { repeated string themes = 1; }
message Ack { string command_id = 1; bool ok = 2; string error = 3; }

message Activate { string command_id = 1; string theme = 2; }
message Deactivate { string command_id = 1; }
message PlaySound { string command_id = 1; string theme = 2; string rel = 3; }
message BurstKey { string command_id = 1; string character = 2; }

message PushThemeChunk {
  string command_id = 1;
  string theme = 2;
  string rel = 3;
  string mime = 4;
  uint32 seq = 5;
  uint32 total = 6;
  bytes data = 7;
}

message ClientToServer {
  oneof msg {
    Hello hello = 1;
    Pong pong = 2;
    StateChanged state = 3;
    ThemeList themes = 4;
    Ack ack = 5;
  }
}

message ServerToClient {
  oneof msg {
    Ping ping = 1;
    Activate activate = 2;
    Deactivate deactivate = 3;
    PlaySound play = 4;
    BurstKey burst = 5;
    PushThemeChunk push = 6;
  }
}

message ClientInfo {
  string client_id = 1;
  string hostname = 2;
  string version = 3;
  ClientState state = 4;
  string theme = 5;
  repeated string themes = 6;
  repeated Display displays = 7;
  int64 connected_at_unix_ms = 8;
}

message Roster { repeated ClientInfo clients = 1; }

message PushTheme { string theme = 1; }

message CommandRequest {
  string client_id = 1;
  oneof action {
    Activate activate = 2;
    Deactivate deactivate = 3;
    PlaySound play = 4;
    BurstKey burst = 5;
    PushTheme push = 6;
  }
}

message CommandResult {
  bool accepted = 1;
  string error = 2;
  string command_id = 3;
}

service RavenControl {
  rpc Connect(stream ClientToServer) returns (stream ServerToClient);
}

service RavenAdmin {
  rpc WatchClients(Empty) returns (stream Roster);
  rpc SendCommand(CommandRequest) returns (CommandResult);
  rpc ListPushableThemes(Empty) returns (ThemeList);
}
```

`BurstKey` is deliberately *not* called `Burst`: the client already exports a `Burst` type from `src/business/types.ts`, and two `Burst` symbols in one file is how import bugs start.

- [ ] **Step 4: Generate and wire the commands**

Add to `package.json` scripts: `"proto": "bunx buf generate proto"`. Add to `Taskfile.yml`:

```yaml
  proto:
    desc: Regenerate protobuf code from proto/ into src/gen/
    cmds: ["bunx buf generate proto"]
```

Run: `bunx buf lint proto && task proto`
Expected: `src/gen/raven/control/v1/control_pb.ts` exists, lint clean.

- [ ] **Step 5: Commit generated code to the tree**

Do **not** gitignore `src/gen/`. Rationale: there is no CI to regenerate it, and `bun run dev` must work on a fresh clone without the buf CLI. Add a one-line note to `AGENTS.md` saying `src/gen/` is generated by `task proto` and must never be hand-edited.

- [ ] **Step 6: Verify and stop**

Run: `task check`
Expected: PASS. Report, **do not commit**.

---

### Task 2: Server client pool (pure business logic)

**Files:**
- Create: `server/business/types.ts`, `server/business/options.ts`, `server/business/deps.ts`, `server/business/index.ts`
- Create: `server/business/onConnect.ts`, `server/business/onDisconnect.ts`, `server/business/onClientMessage.ts`, `server/business/ListClients.ts`, `server/business/GetClient.ts`, `server/business/SendCommand.ts`, `server/business/WatchRoster.ts`
- Test: `server/business/fixture.test.ts`, `server/business/pool.test.ts`
- Modify: `tsconfig.json` — add `server/**/*` to `include`

**Interfaces:**
- Consumes: the generated messages from Task 1.
- Produces: `newPool(opts: Options)` → `{ onConnect, onDisconnect, onClientMessage, ListClients, GetClient, SendCommand, WatchRoster, Broadcast }`, and `type Pool = ReturnType<typeof newPool>`.

This task has **no network code at all**. A connected client is represented by an injected sink, which is what makes the whole pool unit-testable.

- [ ] **Step 1: Define the port and state**

```ts
// server/business/types.ts
import type { ClientInfo, ServerToClient } from "../../src/gen/raven/control/v1/control_pb";

/** How the pool pushes to one client. The transport supplies it; tests supply a fake. */
export type ClientSink = (msg: ServerToClient) => void;

export type PoolEntry = {
  info: ClientInfo;
  send: ClientSink;
  /** Commands sent but not yet acked, so the roster can distinguish intent from reality. */
  pending: Set<string>;
  lastSeen: Date;
};

export type State = { clients: Map<string, PoolEntry> };
```

`Options` carries `now: () => Date` so tests are deterministic, mirroring how `src/business/options.ts` injects `random`.

- [ ] **Step 2: Write the failing test for the load-bearing invariants**

```ts
// server/business/pool.test.ts
import { describe, expect, it } from "bun:test";
import { newPool } from "./index";
import { ClientState } from "../../src/gen/raven/control/v1/control_pb";
import { activate, deactivate, helloFor, stateChanged } from "./fixture.test";

describe("pool", () => {
  describe("onDisconnect", () => {
    it("Should drop a client when its stream closes", () => {
      const pool = newPool({ now: () => new Date(0) });
      pool.onConnect("c1", () => {});
      pool.onClientMessage("c1", helloFor("c1"));
      expect(pool.ListClients()).toHaveLength(1);

      pool.onDisconnect("c1");
      expect(pool.ListClients()).toHaveLength(0);
    });
  });

  describe("SendCommand", () => {
    it("Should refuse a command addressed to an unknown client", () => {
      const pool = newPool({ now: () => new Date(0) });
      const result = pool.SendCommand({ clientId: "ghost", action: deactivate() });
      expect(result.accepted).toBe(false);
      expect(result.error).toContain("unknown client");
    });

    it("Should reflect the client's acked state, not the commanded one", () => {
      // The dashboard must never show ACTIVE for a client that failed to activate -
      // otherwise an operator acts on a machine they believe is armed and it is not.
      const pool = newPool({ now: () => new Date(0) });
      pool.onConnect("c1", () => {});
      pool.onClientMessage("c1", helloFor("c1"));

      pool.SendCommand({ clientId: "c1", action: activate("flocs") });
      expect(pool.GetClient("c1")?.state).toBe(ClientState.PASSIVE);

      pool.onClientMessage("c1", stateChanged(ClientState.ACTIVE, "flocs"));
      expect(pool.GetClient("c1")?.state).toBe(ClientState.ACTIVE);
    });
  });
});
```

`helloFor`, `activate`, `deactivate` and `stateChanged` live in `server/business/fixture.test.ts` — one fixture file, mirroring `src/business/fixture.test.ts`.

- [ ] **Step 3: Run it to verify it fails**

Run: `bun test server/business/pool.test.ts`
Expected: FAIL — `newPool` is not defined.

- [ ] **Step 4: Implement one file per method**

- `onConnect(deps, clientId, sink)` registers an entry with `state: CLIENT_STATE_PASSIVE`.
- `onClientMessage(deps, clientId, msg)` switches on `msg.msg.case`: `hello` fills `info`, `state` updates `info.state`/`info.theme`, `ack` clears the id from `pending`, `pong` refreshes `lastSeen`.
- `onDisconnect(deps, clientId)` deletes the entry.
- `ListClients(deps)` / `GetClient(deps, id)` read.
- `SendCommand(deps, req)` looks up the entry, mints a `commandId` via `crypto.randomUUID()`, records it in `pending`, calls `send`, returns `{ accepted: true, commandId }`.
- `WatchRoster(deps, cb)` registers a listener fired on every mutation and returns an unsubscribe.
- `Broadcast(deps, msg)` pushes to every sink — used by the keepalive.

Every mutation notifies the roster listeners. Bind them in `newPool` exactly like `newBusiness` does:

```ts
// server/business/index.ts
export function newPool(opts: Options) {
  const deps: Deps = { ...opts, state: { clients: new Map() }, listeners: new Set() };
  return {
    onConnect: (id: string, sink: ClientSink): void => onConnect(deps, id, sink),
    onDisconnect: (id: string): void => onDisconnect(deps, id),
    onClientMessage: (id: string, msg: ClientToServer): void => onClientMessage(deps, id, msg),
    ListClients: (): ClientInfo[] => ListClients(deps),
    GetClient: (id: string): ClientInfo | null => GetClient(deps, id),
    SendCommand: (req: CommandRequest): CommandResult => SendCommand(deps, req),
    WatchRoster: (cb: (r: ClientInfo[]) => void): (() => void) => WatchRoster(deps, cb),
    Broadcast: (msg: ServerToClient): void => Broadcast(deps, msg),
  };
}

export type Pool = ReturnType<typeof newPool>;
```

- [ ] **Step 5: Run the tests**

Run: `bun test server/business/`
Expected: PASS, all three.

- [ ] **Step 6: Verify and stop**

Run: `task check` → PASS. Report. **Do not commit.**

---

### Task 3: Server transport — `RavenControl.Connect` + the runnable

**Files:**
- Create: `server/transport/outbox.ts`, `server/transport/outbox.test.ts`, `server/transport/control.ts`, `server/transport/options.ts`
- Create: `server/bin/env.ts`, `server/bin/_bootstrap.ts`, `server/bin/app.ts`
- Modify: `package.json` (a `server` script), `Taskfile.yml` (a `server` task)

**Interfaces:**
- Consumes: `newPool(...)` → `Pool` from Task 2.
- Produces: `newOutbox<T>()` → `{ push(v: T): void; close(): void; [Symbol.asyncIterator](): AsyncIterator<T> }`; `newControlService(opts: { pool: Pool })` returning the Connect service implementation; `bootstrapServer()` → `{ env, services: { pool, themes }, cleanup }`.

- [ ] **Step 1: Write the outbox and its failing tests**

The pool pushes synchronously but a streaming handler yields asynchronously, so a small buffered async iterator bridges them.

```ts
// server/transport/outbox.test.ts
describe("transport", () => {
  describe("outbox", () => {
    it("Should deliver a message pushed before anyone awaits", async () => {
      const outbox = newOutbox<number>();
      outbox.push(1);
      outbox.close();
      const seen: number[] = [];
      for await (const v of outbox) seen.push(v);
      expect(seen).toEqual([1]);
    });

    it("Should end iteration when closed while a consumer is waiting", async () => {
      const outbox = newOutbox<number>();
      const done = (async () => { for await (const _ of outbox) { /* drain */ } })();
      outbox.close();
      await done; // resolves rather than hanging
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL, `newOutbox` is not defined. Then implement it (a queue plus a pending-resolver, resolving `{done:true}` on close).

- [ ] **Step 3: Write the bidi handler**

Each stream is one client. The id comes from `Hello`; until then the connection is registered under a provisional id so a client that never greets is still reaped on disconnect.

```ts
// server/transport/control.ts
export function newControlService(opts: Options) {
  return {
    async *connect(reqs: AsyncIterable<ClientToServer>) {
      const outbox = newOutbox<ServerToClient>();
      const id = crypto.randomUUID();
      opts.pool.onConnect(id, (msg) => outbox.push(msg));

      const pump = (async () => {
        try {
          for await (const req of reqs) opts.pool.onClientMessage(id, req);
        } finally {
          opts.pool.onDisconnect(id);
          outbox.close();
        }
      })();

      try {
        yield* outbox;
      } finally {
        await pump;
      }
    },
  };
}
```

- [ ] **Step 4: Add the keepalive in the bootstrap**

In `server/bin/_bootstrap.ts`, start an interval that calls `pool.Broadcast({ msg: { case: "ping", value: { nonce } } })` every 15s and drops any client whose `lastSeen` is older than 45s. Wire its `clearInterval` into `cleanup`.

- [ ] **Step 5: Two listeners, on purpose**

Serve the **control** service over h2c on `CONTROL_PORT` (default 8787) and leave `ADMIN_PORT` (default 8788) for Task 5. Record as a comment: a browser will not speak HTTP/2 to `http://localhost` without TLS, and gRPC bidi requires HTTP/2 — one listener cannot serve both.

Add `"server": "bun server/bin/app.ts"` to `package.json` scripts and a matching `server` task to `Taskfile.yml`.

- [ ] **Step 6: Smoke-test it end to end**

Run `bun server/bin/app.ts` in one terminal, then the Task 0 client half against port 8787.
Expected: the server logs one connection, `ListClients()` reports it, and the entry disappears when the client is killed.

- [ ] **Step 7: Verify and stop**

Run: `task check` → PASS. Report. **Do not commit.**

---

### Task 4: Client `src/control/` — connect, greet, stay passive

**Files:**
- Create: `src/control/options.ts`, `src/control/index.ts`, `src/control/onCommand.ts`, `src/control/identity.ts`
- Test: `src/control/onCommand.test.ts`, `src/control/fixture.test.ts`
- Modify: `src/bin/env.ts` (add `CONTROL_URL`), `src/bin/_bootstrap.ts` (construct `control`, add to `Services`, add to `cleanup`), `src/bin/app.ts` (**stop calling `input.Start()` at boot**)

**Interfaces:**
- Consumes: `Business`, `Input`, `Overlay`, `ThemeStore` from the existing layers. Note the real signatures: `business.loadTheme(ctx, req?: {name?: string}): Promise<Theme>`, `business.onKeyPressed(ctx, req: KeyPress): Burst | null`, `input.Start(): {bare, control, failed}`, `input.Stop(): void`, `overlay.GetTargetUnderCursor(): OverlayTarget | null`, `overlay.SendBurst(displayId, burst): void`, `overlay.BroadcastTheme(theme): void`, `themes.ListThemes(): Promise<string[]>`.
- Produces: `newControl(opts: Options)` → `{ Start(): void; Stop(): void; isActive(): boolean }`, `type Control = ReturnType<typeof newControl>`.

- [ ] **Step 1: Write the failing test for the invariant that matters most**

```ts
// src/control/onCommand.test.ts
describe("control", () => {
  describe("onCommand", () => {
    it("Should not register hotkeys while passive", async () => {
      // A Carbon hotkey CONSUMES the keystroke system-wide. A client that registers
      // before being activated silently steals the machine owner's keyboard - the
      // single worst failure this system can have.
      const input = newInputSpy();
      const control = newTestControl({ input });

      control.Start();
      await flush();

      expect(input.startCalls).toBe(0);
    });
  });
});
```

`newInputSpy`, `newOverlaySpy`, `newTestControl` and `flush` live in `src/control/fixture.test.ts`.

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/control/onCommand.test.ts`
Expected: FAIL — `newControl` is not defined.

- [ ] **Step 3: Implement the dial loop**

`Start()` opens the stream with `createClient(RavenControl, createGrpcTransport({ baseUrl: opts.controlUrl }))`, sends `Hello` first, then loops `for await (const msg of stream)` dispatching into `onCommand`.

`Hello` is built from `identity.ts` (a `crypto.randomUUID()` held in memory for this milestone — stable identity across restarts is out of scope), `os.hostname()`, `env.VERSION`, the displays from the overlay's screen port, and `await opts.themes.ListThemes()`.

On stream end or throw, reconnect with exponential backoff capped at 30s. Every failure path logs; none throws out of the layer — a server that is down must never take the client with it.

- [ ] **Step 4: Make the client passive at boot**

In `src/bin/app.ts`, delete the `services.input.Start()` call and the `bare`/`control`/`failed` logging that follows it, and start the control layer instead:

```ts
services.overlay.OpenOverlays();

const theme = await services.business.loadTheme(newContext());
services.overlay.BroadcastTheme(theme);

// Passive by default: the keyboard is NOT grabbed until the server says Activate.
services.control.Start();

console.log(`[raven] ${env.VERSION} ready - passive, theme "${theme.name}"`);
```

The `bare`/`control`/`failed` reporting moves into the `Activate` handler in Task 8, where `input.Start()` now lives. Keep the existing SIGINT/SIGTERM `cleanup` wiring.

- [ ] **Step 5: Run the tests**

Run: `bun test src/control/` → PASS.

- [ ] **Step 6: Verify by hand**

Run `bun run dev` with the server down. Expected: raven opens its overlays, **typing is completely unaffected**, and the console shows reconnect attempts backing off. This is the single most important manual check in the plan.

- [ ] **Step 7: Verify and stop**

Run: `task check` → PASS. Report. **Do not commit.**

---

### Task 5: Admin service — `WatchClients`, `SendCommand`, `ListPushableThemes`

**Files:**
- Create: `server/transport/admin.ts`, `server/transport/admin.test.ts`
- Modify: `server/bin/_bootstrap.ts` (construct a `ThemeStore`), `server/bin/app.ts` (mount the admin routes on the HTTP/1.1 listener)

**Interfaces:**
- Consumes: `Pool` from Task 2, `newThemeStore` from `src/themes`.
- Produces: `newAdminService(opts: { pool: Pool; themes: ThemeStore })`.

- [ ] **Step 1: Reuse the theme data layer instead of duplicating it**

The server enumerates pushable themes with the client's own data layer — that layer's whole point is that the `assets/themes` tree *is* the schema:

```ts
// server/bin/_bootstrap.ts
const themes = newThemeStore({
  themesRoot: env.THEMES_ROOT,        // repo-root assets/themes
  settingsPath: env.SETTINGS_PATH,    // server-local scratch file; unused by the admin path
  assetBaseUrl: "pushed://",          // the client swaps these for blob: URLs (Task 9)
});
```

- [ ] **Step 2: Implement `WatchClients` as a server-stream**

Yield a full `Roster` snapshot immediately on subscribe, then one on every `pool.WatchRoster` fire, until the request signal aborts. Use the same `newOutbox` from Task 3 to bridge the callback into the async iterator. Snapshots, not deltas — a roster of office machines is tiny, and deltas would be premature optimization.

- [ ] **Step 3: Implement `SendCommand` and `ListPushableThemes`**

`SendCommand` is a thin pass-through to `pool.SendCommand`. `ListPushableThemes` returns `{ themes: await themes.ListThemes() }`.

- [ ] **Step 4: Test the behaviour that is not the pool's**

```ts
it("Should push a fresh roster to every watcher when a client connects", async () => { /* ... */ });
it("Should stop streaming once the request is aborted", async () => { /* no leaked listener */ });
```

- [ ] **Step 5: Verify and stop**

Run: `task check` → PASS. Report. **Do not commit.**

---

### Task 6: The dashboard

**Files:**
- Create: `server/web/index.html`, `server/web/main.ts`, `server/web/style.css`
- Modify: `server/bin/app.ts` (serve `server/web/` on the HTTP/1.1 listener, bundling `main.ts` via `Bun.build`)

- [ ] **Step 1: Plain TS, no framework**

The repo's only existing view (`src/views/overlay/`) is plain TS over a canvas. An internal admin panel does not justify introducing React.

- [ ] **Step 2: Subscribe to the live roster**

```ts
const client = createClient(
  RavenAdmin,
  createGrpcWebTransport({ baseUrl: window.location.origin }),
);

for await (const roster of client.watchClients({})) render(roster.clients);
```

gRPC-Web supports unary and **server-streaming only** — which is exactly why the admin service was split from the bidi one. Do not try to open a bidi stream from the browser.

- [ ] **Step 3: Render one row per client**

Columns: id (shortened), hostname, displays, state badge (`PASSIVE`/`ACTIVE`), current theme, available themes. Actions per row: Activate (with a theme `<select>` populated from `ListPushableThemes`), Deactivate, PlaySound (theme + rel), BurstKey (a single-character input), PushTheme (theme `<select>`).

- [ ] **Step 4: Reflect reality, not intent**

After `SendCommand` resolves, do **not** optimistically flip the badge. Let the next `WatchClients` snapshot — driven by the client's `StateChanged` — do it. Record that as the *why* in a comment; it is the same invariant Task 2's third test protects.

- [ ] **Step 5: Verify by hand and stop**

Open `http://localhost:8788`, launch a client. Expected: the row appears within a second, shows `PASSIVE`, and disappears when the client is killed. Report. **Do not commit.**

---

### Task 7: One-shots — `PlaySound` and `BurstKey` (the spine closes here)

**Files:**
- Create: `src/business/playAsset.ts`, `src/business/playAsset.test.ts`
- Modify: `src/business/index.ts` (bind `playAsset`), `src/control/onCommand.ts`, `src/control/onCommand.test.ts`

**Interfaces:**
- Produces: `business.playAsset(ctx, req: { theme: string; rel: string; position: {x,y}; scaleFactor: number }): Promise<Burst | null>`.

- [ ] **Step 1: Write the failing test**

```ts
it("Should play a one-shot while passive", async () => {
  // One-shots must not depend on key capture, or the whole point of a dormant
  // client - triggering a sound on a machine nobody is typing on - disappears.
  const overlay = newOverlaySpy();
  const control = newTestControl({ overlay, input: newInputSpy() });
  control.Start();

  await control.onCommand(playSound({ theme: "raven", rel: "raven/global/leo/leo.m4a" }));

  expect(overlay.bursts).toHaveLength(1);
  expect(overlay.bursts[0]?.sound?.rel).toBe("raven/global/leo/leo.m4a");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `bun test src/business/playAsset.test.ts src/control/onCommand.test.ts`
Expected: FAIL — `playAsset` is not defined.

- [ ] **Step 3: Implement `playAsset`**

It loads the named theme if it is not the current one, finds the `ThemeAsset` whose `rel` matches across `groups` and `keys`, and returns a `Burst` with that asset as `sound`, images drawn from the same group (so a voice keeps its own photos, per AGENTS.md), and the given `position`/`scaleFactor`. Returns `null` when the asset is not found.

- [ ] **Step 4: Implement both handlers in `onCommand`**

Both resolve their target the same way `src/input/index.ts` already does, so there is exactly one notion of "where a burst lands":

```ts
case "play": {
  const target = opts.overlay.GetTargetUnderCursor();
  if (!target) return ack(cmd.commandId, false, "no display under cursor");
  const burst = await opts.business.playAsset(newContext(), {
    theme: cmd.theme, rel: cmd.rel,
    position: target.position, scaleFactor: target.scaleFactor,
  });
  if (burst) opts.overlay.SendBurst(target.displayId, burst);
  return ack(cmd.commandId, burst !== null, burst ? "" : "asset not found");
}

case "burst": {
  const target = opts.overlay.GetTargetUnderCursor();
  if (!target) return ack(cmd.commandId, false, "no display under cursor");
  const burst = opts.business.onKeyPressed(newContext(), {
    char: cmd.character, position: target.position, scaleFactor: target.scaleFactor,
  });
  if (burst) opts.overlay.SendBurst(target.displayId, burst);
  return ack(cmd.commandId, burst !== null);
}
```

`BurstKey` reuses `onKeyPressed` untouched — the anti-repeat histories documented in AGENTS.md apply to remote bursts exactly as to local ones, which is the behaviour you want.

- [ ] **Step 5: Run the tests** → PASS.

- [ ] **Step 6: Verify the whole spine by hand**

Server up, client up, dashboard open. Click **PlaySound** on the row. Expected: the sound plays on the client machine and sprites spray at the cursor, **while the client is still passive and typing is unaffected**. This is the milestone's headline demo.

- [ ] **Step 7: Verify and stop**

Run: `task check` → PASS. Report. **Do not commit.**

---

### Task 8: `Activate` / `Deactivate`

**Files:**
- Modify: `src/control/onCommand.ts`, `src/control/onCommand.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
it("Should grab the keyboard only once activated", async () => {
  const input = newInputSpy();
  const control = newTestControl({ input });
  control.Start();
  await control.onCommand(activate("flocs"));
  expect(input.startCalls).toBe(1);
});

it("Should hand the keyboard back on deactivate", async () => {
  // A leak here leaves the machine owner unable to type, with no way to recover
  // short of killing the process.
  const input = newInputSpy();
  const control = newTestControl({ input });
  control.Start();
  await control.onCommand(activate("flocs"));
  await control.onCommand(deactivate());
  expect(input.stopCalls).toBe(1);
});

it("Should report the theme it actually loaded, not the one requested", async () => {
  // loadTheme falls back when the named theme is missing; the roster must not
  // claim a theme the client is not running.
});
```

- [ ] **Step 2: Run to verify they fail** → FAIL.

- [ ] **Step 3: Implement**

```ts
case "activate": {
  const theme = await opts.business.loadTheme(newContext(), { name: cmd.theme });
  opts.overlay.BroadcastTheme(theme);
  const { bare, control, failed } = opts.input.Start();
  if (failed.length > 0) {
    // RegisterEventHotKey refuses a combination another app already holds. Say so.
    console.warn(`[raven] could not grab ${failed.length}: ${failed.join(" ")}`);
  }
  console.log(`[raven] active - theme "${theme.name}", ${bare} keys grabbed, ${control} hotkeys`);
  send(stateChanged(ClientState.ACTIVE, theme.name));
  return ack(cmd.commandId, true);
}

case "deactivate": {
  opts.input.Stop();
  send(stateChanged(ClientState.PASSIVE, ""));
  return ack(cmd.commandId, true);
}
```

`input.Stop()` already calls `native.unregisterAllHotkeys()` and clears the registration map — no new native code is needed.

- [ ] **Step 4: Run the tests** → PASS.

- [ ] **Step 5: Verify by hand**

Activate from the dashboard → typing bursts, and note that the grabbed keys are swallowed system-wide (expected — it is raven's core mechanic). Deactivate → **typing is immediately clean again**. Verify this last one carefully; a leak here bricks the machine owner's keyboard.

- [ ] **Step 6: Verify and stop**

Run: `task check` → PASS. Report. **Do not commit.**

---

### Task 9: `PushTheme` — chunked transfer and blob URLs

**Files:**
- Create: `server/business/PushTheme.ts`, `src/control/receiveTheme.ts`, `src/control/receiveTheme.test.ts`
- Modify: `src/overlay/types.ts` (extend `OverlayRPCSchema`), `src/overlay/index.ts` (add `SendThemeAssets`), `src/views/overlay/index.ts` (build blob URLs), `src/control/onCommand.ts`, `server/transport/admin.ts` (route the `push` action)

**Interfaces:**
- Produces: `sanitizeRel(rel: string): string | null`; the RPC message `pushedTheme: { theme: Theme; assets: { rel: string; mime: string; base64: string }[] }`; `overlay.SendThemeAssets(payload): void`.

- [ ] **Step 1: Understand the constraint before writing anything**

Re-read the "Serving theme assets to the webview" section of `AGENTS.md`. The webview loads assets **only** via `views://`, and **only** from paths physically under the view's folder inside the bundle — fixed at build time, read-only once signed. `appData://` fails and custom schemes are not fetchable. **A theme pushed at runtime therefore cannot be written into the bundle nor served over `views://`.** Bytes go through the main process to the webview, which turns them into blob URLs.

- [ ] **Step 2: Write the failing tests**

```ts
describe("control", () => {
  describe("receiveTheme", () => {
    it("Should reject a pushed asset path that escapes its theme", () => {
      // Nothing is written to disk today, but disk persistence is the obvious next
      // step and a traversal bug introduced now would ship silently with it.
      expect(sanitizeRel("../../../.ssh/id_rsa")).toBeNull();
      expect(sanitizeRel("/etc/passwd")).toBeNull();
      expect(sanitizeRel("flocs/a/a.m4a")).toBe("flocs/a/a.m4a");
    });

    it("Should assemble a theme once the last chunk arrives", () => {
      // seq 0..total-1; nothing is handed to the overlay before the last one.
    });
  });
});
```

- [ ] **Step 3: Run to verify it fails** → FAIL.

- [ ] **Step 4: Implement the server side**

`PushTheme(deps, { clientId, theme })` reads the theme with `themes.GetTheme(name)` (asset URLs come back as `pushed://<rel>` thanks to Task 5's `assetBaseUrl`), walks every `ThemeAsset` across `intro`, `groups` and `keys`, reads each file off disk, and sends one `PushThemeChunk` per file with `seq`/`total` set. One message per file — the clips are small; finer chunking is not warranted yet.

- [ ] **Step 5: Implement the client side**

`receiveTheme` accumulates chunks keyed by `commandId`, rejecting any chunk whose `rel` fails `sanitizeRel`. On the last chunk it calls `overlay.SendThemeAssets({ theme, assets })` and acks.

- [ ] **Step 6: Implement the webview side**

Extend `OverlayRPCSchema.webview.messages` with `pushedTheme`. In the renderer, build the blob map and **rewrite the `Theme`'s asset URLs in place** before adopting it:

```ts
const urls = new Map<string, string>();
for (const a of assets) {
  const bytes = Uint8Array.from(atob(a.base64), (c) => c.charCodeAt(0));
  urls.set(a.rel, URL.createObjectURL(new Blob([bytes], { type: a.mime })));
}
for (const group of [...theme.groups, ...Object.values(theme.keys)]) {
  for (const asset of [...group.sounds, ...group.images]) {
    asset.url = urls.get(asset.rel) ?? asset.url;
  }
}
```

Electrobun's RPC is JSON-based, so bytes travel base64-encoded — hence `SendThemeAssets` takes `base64`, not `Uint8Array`. Record that as the *why* in a comment. Revoke the previous pushed theme's object URLs on replacement so repeated pushes do not leak.

- [ ] **Step 7: Run the tests** → PASS.

- [ ] **Step 8: Verify by hand**

From the dashboard, push `flocs` to a client, then Activate it with `flocs`. Expected: the pushed theme plays. Then restart the client and confirm the pushed theme is gone — in-memory only is the documented v1 behaviour, not a bug.

- [ ] **Step 9: Verify and stop**

Run: `task check` → PASS. Report the full milestone against the spec's success criteria. **Do not commit.**

---

## Self-review notes

- **Spec coverage:** all nine spec slices map to Tasks 1–9; Spike 0 maps to the spec's blocking gate; the spec's "out of scope" list (auth, TLS, disk persistence, stable identity, multi-admin, Windows/Linux) is implemented nowhere on purpose, and Task 9 Step 8 makes the non-persistence explicit rather than silent.
- **Type consistency:** the proto message is `BurstKey` everywhere (never `Burst`, which is `src/business/types.ts`'s); the pool is `newPool`/`Pool` everywhere; `ClientSink` is the single name for the push port; `newOutbox` is defined in Task 3 and reused in Task 5.
- **Known deviation from the writing-plans skill:** the skill's per-task "Commit" step is replaced by "stop and report", because the user's CLAUDE.md forbids committing without an explicit request and user instructions override skills.
