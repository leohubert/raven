import { create } from "@bufbuild/protobuf";
import { createHandlerContext } from "@connectrpc/connect";
import { describe, expect, it } from "bun:test";
import { newAdminService } from "./admin";
import { newPool } from "../business";
import { helloFor } from "../business/fixture.test";
import type { ThemeStore } from "../../src/themes";
import {
	CommandRequestSchema,
	ListPushableThemesRequestSchema,
	PlaySoundSchema,
	PushThemeSchema,
	RavenAdmin,
	WatchClientsRequestSchema,
} from "../../src/gen/raven/control/v1/control_pb";

function fakeThemeStore(themes: string[] = []): ThemeStore {
	return {
		ListThemes: async () => themes,
		GetTheme: async () => {
			throw new Error("fakeThemeStore.GetTheme not implemented");
		},
		GetSettings: async () => ({ theme: null }),
		UpdateSettings: async (patch) => ({ theme: patch.theme ?? null }),
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
				const admin = newAdminService({ pool, themes: fakeThemeStore() });

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

				const admin = newAdminService({ pool, themes: fakeThemeStore() });
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
				const admin = newAdminService({ pool, themes: fakeThemeStore() });

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

			it("Should refuse push, since it fans out over PushThemeChunk instead of being one routable command", async () => {
				const pool = newPool({ now: () => new Date(0) });
				const admin = newAdminService({ pool, themes: fakeThemeStore() });

				const wireReq = create(CommandRequestSchema, {
					clientId: "c1",
					action: { case: "push", value: create(PushThemeSchema, { theme: "flocs" }) },
				});

				const result = await admin.sendCommand(wireReq);

				expect(result.accepted).toBe(false);
				expect(result.error).toContain("push");
			});
		});

		describe("listPushableThemes", () => {
			it("Should return the themes from the theme store", async () => {
				const pool = newPool({ now: () => new Date(0) });
				const admin = newAdminService({ pool, themes: fakeThemeStore(["flocs", "raven"]) });

				const result = await admin.listPushableThemes(create(ListPushableThemesRequestSchema, {}));

				expect(result.themes).toEqual(["flocs", "raven"]);
			});
		});
	});
});
