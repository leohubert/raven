import { ClientPanel } from "./ClientPanel";
import { useRoster, type RosterState } from "./useRoster";

const STATUS_BASE_CLASS = "text-[12px] px-2 py-0.5 rounded-full font-semibold";

/**
 * `useRosterState` defaults to the real `useRoster` hook; tests override it with a stub
 * returning a fixed `RosterState` so App's own render (in particular its `key={client.clientId}`
 * reconciliation) can be exercised without going through Bun's process-wide module registry -
 * `mock.module("./useRoster", ...)` leaks into any other test file that imports the real hook.
 */
export function App({ useRosterState = useRoster }: { useRosterState?: () => RosterState } = {}) {
	const { clients, connectionState, statusMessage, themes, themesError } = useRosterState();
	const statusClassName =
		connectionState === "live"
			? `${STATUS_BASE_CLASS} bg-(--active-bg) text-(--active)`
			: `${STATUS_BASE_CLASS} bg-(--error-bg) text-(--error)`;

	/**
	 * A dropped stream does not clear the roster - the last snapshot stays on screen, which is
	 * the right call (the machines are probably still there) but leaves every badge asserting a
	 * state nothing is confirming any more. `ClientInfo` carries no last-seen field, so the
	 * honest thing to say is about the snapshot, not about any one client: this is what the
	 * server last sent, and it has stopped arriving.
	 */
	const stale = connectionState !== "live" && clients.length > 0;

	return (
		<div className="max-w-[1400px] mx-auto flex flex-col gap-(--s5)">
			<header className="flex items-baseline gap-(--s3)">
				<h1 className="text-[22px] font-[650] tracking-[-0.015em]">raven</h1>
				<span className={statusClassName} role="status" aria-live="polite">
					{statusMessage}
				</span>
			</header>

			<p
				className="text-(--error) bg-(--error-bg) px-(--s3) py-(--s2) rounded-[6px] max-w-[70ch]"
				role="alert"
				hidden={themesError === null}
			>
				{themesError}
			</p>

			<p
				className="text-[12px] text-(--passive) bg-(--passive-bg) px-(--s3) py-(--s2) rounded-[6px] max-w-[70ch]"
				hidden={!stale}
			>
				Last roster the server sent. These states are no longer being confirmed.
			</p>

			<ul className="roster" aria-label="Connected clients" data-stale={stale}>
				{clients.length === 0 ? (
					<li className="col-span-full bg-(--surface) border border-dashed border-(--border) rounded-[10px] p-(--s8) text-center text-(--muted)">
						No clients connected. Start a raven client and it will appear here.
					</li>
				) : (
					clients.map((client) => <ClientPanel key={client.clientId} client={client} pushableThemes={themes} />)
				)}
			</ul>
		</div>
	);
}
