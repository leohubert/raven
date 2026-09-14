import { create } from "@bufbuild/protobuf";
import { describe, expect, it } from "bun:test";
import { newPool } from "./index";
import { onClientMessage } from "./onClientMessage";
import {
	BurstKeySchema,
	ClientState,
	DeactivateSchema,
	PlaySoundSchema,
	ServerToClientSchema,
	type ClientInfo,
	type ServerToClient,
} from "../../src/gen/raven/control/v1/control_pb";
import type { Deps } from "./deps";
import {
	ack,
	activate,
	burst,
	deactivate,
	entryFixture,
	helloFor,
	play,
	pong,
	stateChanged,
} from "./fixture.test";

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

		it("Should send a play command to the client's sink, tagged with the minted commandId", () => {
			// The client's Ack echoes commandId back - if the pool sent a different id than
			// it returned to the caller, the ack could never be matched to this command.
			const pool = newPool({ now: () => new Date(0) });
			const sent: ServerToClient[] = [];
			pool.onConnect("c1", (msg) => sent.push(msg));
			pool.onClientMessage("c1", helloFor("c1"));

			const result = pool.SendCommand({ clientId: "c1", action: play("flocs", "a/manu-a.m4a") });

			expect(sent).toEqual([
				create(ServerToClientSchema, {
					msg: {
						case: "play",
						value: create(PlaySoundSchema, {
							commandId: result.commandId,
							theme: "flocs",
							rel: "a/manu-a.m4a",
						}),
					},
				}),
			]);
		});

		it("Should send a burst command to the client's sink, tagged with the minted commandId", () => {
			const pool = newPool({ now: () => new Date(0) });
			const sent: ServerToClient[] = [];
			pool.onConnect("c1", (msg) => sent.push(msg));
			pool.onClientMessage("c1", helloFor("c1"));

			const result = pool.SendCommand({ clientId: "c1", action: burst("z") });

			expect(sent[0]?.msg).toEqual({
				case: "burst",
				value: create(BurstKeySchema, { commandId: result.commandId, character: "z" }),
			});
		});
	});

	describe("PruneStale", () => {
		it("Should drop a client that has not ponged since the deadline", () => {
			// Task 3's keepalive calls this to evict a client whose stream died without a
			// clean disconnect - otherwise a dead client lingers in the roster forever and an
			// operator could still try to command a machine that is no longer listening.
			const pool = newPool({ now: () => new Date(1000) });
			pool.onConnect("c1", () => {});
			pool.onClientMessage("c1", helloFor("c1"));

			const dropped = pool.PruneStale(new Date(2000));

			expect(dropped).toEqual(["c1"]);
			expect(pool.ListClients()).toHaveLength(0);
		});

		it("Should keep a client that ponged after the deadline", () => {
			// A live client must never be pruned just because it connected long ago - only
			// silence since the deadline should count, or the keepalive would evict active machines.
			let now = new Date(1000);
			const pool = newPool({ now: () => now });
			pool.onConnect("c1", () => {});
			pool.onClientMessage("c1", helloFor("c1"));
			now = new Date(5000);
			pool.onClientMessage("c1", pong());

			const dropped = pool.PruneStale(new Date(2000));

			expect(dropped).toEqual([]);
			expect(pool.ListClients()).toHaveLength(1);
		});
	});

	describe("onClientMessage", () => {
		// pending is write-only from the pool's public API - SendCommand writes it and
		// this ack branch is the only reader. There is no getter to assert through, so
		// these pin the mutation directly on a hand-built entry, the same object shape
		// onClientMessage itself reads and writes.
		it("Should clear a known command from pending when the client acks it", () => {
			const entry = entryFixture({ pending: new Set(["cmd-1"]) });
			const deps: Deps = { now: () => new Date(0), state: { clients: new Map([["c1", entry]]) }, listeners: new Set() };

			onClientMessage(deps, "c1", ack("cmd-1"));

			expect(entry.pending.has("cmd-1")).toBe(false);
		});

		it("Should clear pending even when the ack reports the command failed - ok:false is currently swallowed everywhere else, a known gap for a later milestone, not this test", () => {
			const entry = entryFixture({ pending: new Set(["cmd-1"]) });
			const deps: Deps = { now: () => new Date(0), state: { clients: new Map([["c1", entry]]) }, listeners: new Set() };

			onClientMessage(deps, "c1", ack("cmd-1", false, "asset not found"));

			expect(entry.pending.has("cmd-1")).toBe(false);
		});

		it("Should do nothing for an ack whose command id was never pending", () => {
			const entry = entryFixture({ pending: new Set() });
			const deps: Deps = { now: () => new Date(0), state: { clients: new Map([["c1", entry]]) }, listeners: new Set() };

			expect(() => onClientMessage(deps, "c1", ack("never-sent"))).not.toThrow();
			expect(entry.pending.size).toBe(0);
		});

		it("Should do nothing for an ack from a client the pool does not know", () => {
			const deps: Deps = { now: () => new Date(0), state: { clients: new Map() }, listeners: new Set() };

			expect(() => onClientMessage(deps, "ghost", ack("cmd-1"))).not.toThrow();
		});
	});

	describe("WatchRoster", () => {
		it("Should push a fresh roster to a watcher on every mutation: connect, hello, state change, and disconnect", () => {
			const pool = newPool({ now: () => new Date(0) });
			const rosters: ClientInfo[][] = [];
			pool.WatchRoster((roster) => rosters.push(roster));

			pool.onConnect("c1", () => {});
			expect(rosters).toHaveLength(1);
			expect(rosters[0]?.[0]?.clientId).toBe("c1");

			pool.onClientMessage("c1", helloFor("c1"));
			expect(rosters).toHaveLength(2);
			expect(rosters[1]?.[0]?.hostname).toBe("mac");

			pool.onClientMessage("c1", stateChanged(ClientState.ACTIVE, "flocs"));
			expect(rosters).toHaveLength(3);
			expect(rosters[2]?.[0]?.state).toBe(ClientState.ACTIVE);

			pool.onDisconnect("c1");
			expect(rosters).toHaveLength(4);
			expect(rosters[3]).toHaveLength(0);
		});

		it("Should notify when PruneStale drops someone, and not notify when it drops no one", () => {
			// A watcher that fires on a no-op prune would make every idle keepalive tick
			// look like a roster change, drowning out the changes that actually matter.
			const pool = newPool({ now: () => new Date(1000) });
			pool.onConnect("c1", () => {});
			pool.onClientMessage("c1", helloFor("c1"));

			const rosters: ClientInfo[][] = [];
			pool.WatchRoster((roster) => rosters.push(roster));

			pool.PruneStale(new Date(500));
			expect(rosters).toHaveLength(0);

			pool.PruneStale(new Date(2000));
			expect(rosters).toHaveLength(1);
			expect(rosters[0]).toHaveLength(0);
		});

		it("Should stop delivering to a watcher once unsubscribed, and tolerate unsubscribing twice", () => {
			const pool = newPool({ now: () => new Date(0) });
			const rosters: ClientInfo[][] = [];
			const unsubscribe = pool.WatchRoster((roster) => rosters.push(roster));

			pool.onConnect("c1", () => {});
			expect(rosters).toHaveLength(1);

			unsubscribe();
			pool.onConnect("c2", () => {});
			expect(rosters).toHaveLength(1);

			expect(() => unsubscribe()).not.toThrow();
		});
	});

	describe("Broadcast", () => {
		it("Should reach every connected sink, and none that has disconnected", () => {
			const pool = newPool({ now: () => new Date(0) });
			const received1: ServerToClient[] = [];
			const received2: ServerToClient[] = [];
			pool.onConnect("c1", (msg) => received1.push(msg));
			pool.onConnect("c2", (msg) => received2.push(msg));
			pool.onDisconnect("c2");

			const msg = create(ServerToClientSchema, {
				msg: { case: "deactivate", value: create(DeactivateSchema, { commandId: "x" }) },
			});
			pool.Broadcast(msg);

			expect(received1).toEqual([msg]);
			expect(received2).toEqual([]);
		});
	});
});
