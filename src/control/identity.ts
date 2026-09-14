/**
 * One id per process, held in memory only. Stable identity across restarts is out of
 * scope for this milestone - the server keys the roster off the connection, not this id.
 */
export function newIdentity() {
	return { clientId: crypto.randomUUID() };
}

export type Identity = ReturnType<typeof newIdentity>;
