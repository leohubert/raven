import { create } from "@bufbuild/protobuf";
import { createHandlerContext } from "@connectrpc/connect";
import { describe, expect, it } from "bun:test";
import { newAdminService } from "./admin";
import { newPool } from "../business";
import { helloFor, themeStoreFixture } from "../business/fixture.test";
import type { Theme } from "../../src/themes";
import {
	CommandRequestSchema,
	ListPushableThemesRequestSchema,
	PlaySoundSchema,
	PushThemeSchema,
	RavenAdmin,
	WatchClientsRequestSchema,
	type ServerToClient,
} from "../../src/gen/raven/control/v1/control_pb";

/** A one-file theme: enough to tell a manifest chunk from an asset chunk. */
function themeOf(name: string): Theme {
	return {
		name,
		intro: [{ rel: `${name}/intro.m4a`, url: `pushed:///${name}/intro.m4a`, kind: "sound" }],
		groups: [],
		keys: {},
	};
}

function testContext() {
	return createHandlerContext({
		service: RavenAdmin,
		method: RavenAdmin.method.watchClients,
		protocolName: "connect",
		requestMethod: "POST",
		url: "http://localhost/test",
	});
}

describe("transport", () => {
	describe("admin", () => {
		describe("watchClients", () => {
			it("Should push a fresh roster to every watcher when a client connects", async () => {
				const pool = newPool({ now: () => new Date(0) });
				const admin = newAdminService({ pool, themes: themeStoreFixture() });

				const streamA = admin.watchClients(create(WatchClientsRequestSchema, {}), testContext());
				const streamB = admin.watchClients(create(WatchClientsRequestSchema, {}), testContext());

				const firstA = await streamA.next();
				const firstB = await streamB.next();
				expect(firstA.value?.clients).toHaveLength(0);
				expect(firstB.value?.clients).toHaveLength(0);

				pool.onConnect("c1", () => {});

				const secondA = await streamA.next();
				const secondB = await streamB.next();
				expect(secondA.value?.clients).toHaveLength(1);
				expect(secondA.value?.clients[0]?.clientId).toBe("c1");
				expect(secondB.value?.clients[0]?.clientId).toBe("c1");
			});

			it("Should stop streaming once the request is aborted, with no leaked listener", async () => {
				const pool = newPool({ now: () => new Date(0) });
				let unsubscribeCalls = 0;
				const originalWatchRoster = pool.WatchRoster;
				pool.WatchRoster = (cb) => {
					const unsubscribe = originalWatchRoster(cb);
					return () => {
						unsubscribeCalls++;
						unsubscribe();
					};
				};

				const admin = newAdminService({ pool, themes: themeStoreFixture() });
				const context = testContext();
				const stream = admin.watchClients(create(WatchClientsRequestSchema, {}), context);

				await stream.next(); // consumes the initial snapshot, subscribing to the pool

				context.abort();
				const result = await stream.next();

				expect(result.done).toBe(true);
				expect(unsubscribeCalls).toBe(1);
			});
		});

		describe("sendCommand", () => {
			it("Should map the wire request to the pool's local shape, dropping any incoming commandId", async () => {
				const pool = newPool({ now: () => new Date(0) });
				pool.onConnect("c1", () => {});
				pool.onClientMessage("c1", helloFor("c1"));
				const admin = newAdminService({ pool, themes: themeStoreFixture() });

				const wireReq = create(CommandRequestSchema, {
					clientId: "c1",
					action: {
						case: "play",
						value: create(PlaySoundSchema, {
							commandId: "operator-supplied",
							theme: "flocs",
							rel: "a/manu-a.m4a",
						}),
					},
				});

				const result = await admin.sendCommand(wireReq);

				expect(result.accepted).toBe(true);
				expect(result.commandId).not.toBe("operator-supplied");
			});

			it("Should fan a push out over the client's own stream, which is the only way a theme reaches a machine that lacks it", async () => {
				const sent: ServerToClient[] = [];
				const pool = newPool({ now: () => new Date(0) });
				pool.onConnect("c1", (msg) => sent.push(msg));
				pool.onClientMessage("c1", helloFor("c1"));
				const admin = newAdminService({ pool, themes: themeStoreFixture([themeOf("flocs")]) });

				const wireReq = create(CommandRequestSchema, {
					clientId: "c1",
					action: { case: "push", value: create(PushThemeSchema, { theme: "flocs" }) },
				});

				const result = await admin.sendCommand(wireReq);

				expect(result.accepted).toBe(true);
				// The manifest, then the theme's one file.
				expect(sent.map((m) => m.msg.case)).toEqual(["push", "push"]);
			});

			it("Should report a theme the server cannot read rather than accepting a push that sends nothing", async () => {
				const pool = newPool({ now: () => new Date(0) });
				pool.onConnect("c1", () => {});
				pool.onClientMessage("c1", helloFor("c1"));
				const admin = newAdminService({ pool, themes: themeStoreFixture() });

				const result = await admin.sendCommand(
					create(CommandRequestSchema, {
						clientId: "c1",
						action: { case: "push", value: create(PushThemeSchema, { theme: "ghost" }) },
					}),
				);

				expect(result.accepted).toBe(false);
				expect(result.error).toContain("ghost");
			});
		});

		describe("listPushableThemes", () => {
			it("Should return the themes from the theme store", async () => {
				const pool = newPool({ now: () => new Date(0) });
				const admin = newAdminService({ pool, themes: themeStoreFixture([themeOf("flocs"), themeOf("raven")]) });

				const result = await admin.listPushableThemes(create(ListPushableThemesRequestSchema, {}));

				expect(result.themes).toEqual(["flocs", "raven"]);
			});
		});
	});
});
