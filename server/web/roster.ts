import type { ClientInfo } from "../../src/gen/raven/control/v1/control_pb";

/**
 * Pure roster-diffing logic, split out of main.ts so it is unit-testable without a DOM.
 * The row-scoped renderer uses this to know which clientIds need a brand-new `<tr>` and
 * which have left (so their `<tr>` can be removed) - every clientId that is neither added
 * nor removed keeps its existing row untouched. That is the entire fix for the focus/typed-
 * input loss a full-table re-render caused: an existing row's `<select>`/`<input>` elements
 * are never recreated just because some other row's command finished or some other client's
 * state changed.
 */
export function diffClientIds(
	renderedIds: ReadonlySet<string>,
	clients: readonly Pick<ClientInfo, "clientId">[],
): { added: string[]; removed: string[] } {
	const nextIds = new Set(clients.map((c) => c.clientId));
	const added = clients.map((c) => c.clientId).filter((id) => !renderedIds.has(id));
	const removed = [...renderedIds].filter((id) => !nextIds.has(id));
	return { added, removed };
}
