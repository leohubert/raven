import { useState } from "react";
import { create } from "@bufbuild/protobuf";
import {
	ClientState,
	CommandRequestSchema,
	type ClientInfo,
	type CommandRequest,
	type Display,
} from "../../src/gen/raven/control/v1/control_pb";
import { activateAction, burstAction, deactivateAction, playAction, pushAction, ravenAdminClient } from "./actions";
import { describeError } from "./describeError";

function shortId(id: string): string {
	return id.length > 12 ? `${id.slice(0, 12)}…` : id;
}

function formatDisplays(displays: Display[]): string {
	if (displays.length === 0) return "—";
	return displays.map((d) => `${d.width}×${d.height}@${d.scaleFactor}x`).join(" · ");
}

/**
 * Seconds precision and a full date are noise on a roster the operator refreshes by looking at
 * it: what matters is "since when today", and the date only once that stops being today. Also
 * keeps the meta line from wrapping to two lines in a narrow panel.
 */
function formatConnectedAt(unixMs: bigint): string {
	const at = new Date(Number(unixMs));
	const time = at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
	if (at.toDateString() === new Date().toDateString()) return time;
	return `${at.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${time}`;
}

/**
 * The only place `ClientInfo.state` is turned into a badge label. This has exactly one input -
 * the state a `WatchClients` snapshot reported - and must never be derived from anything a
 * command sent to this client (see the badge-honesty test in ClientPanel.test.tsx).
 */
function badgeLabel(state: ClientState): string {
	return state === ClientState.ACTIVE ? "ACTIVE" : state === ClientState.PASSIVE ? "PASSIVE" : "UNKNOWN";
}

type Feedback = { tone: "pending" | "ok" | "error"; message: string } | null;

// Split from the panel's background for the reason CONTROL_LAYOUT_CLASS documents below: an
// armed panel sets bg-(--active-tint) instead of bg-(--surface), and appending one onto a
// string that already carries the other would be resolved by stylesheet order, not by intent.
const CLIENT_LAYOUT_CLASS =
	"border border-(--border) rounded-[10px] p-(--s5) [@media(max-width:30rem)]:p-(--s4) flex flex-col gap-(--s5) shadow-[0_1px_2px_rgba(27,27,31,0.04),0_8px_24px_-12px_rgba(27,27,31,0.14)]";

/**
 * The one question the operator opens this page to answer is whether a machine is armed, and
 * three same-coloured panels make them read three badges to find out. The tint answers it at
 * the panel level; the badge stays the precise statement. Only ACTIVE earns it - PASSIVE is the
 * default state and should look like the default.
 */
function clientClassName(state: ClientState): string {
	return state === ClientState.ACTIVE
		? `${CLIENT_LAYOUT_CLASS} bg-(--active-tint)`
		: `${CLIENT_LAYOUT_CLASS} bg-(--surface)`;
}

const CLIENT_HEAD_CLASS = "flex items-start justify-between gap-(--s3)";
const CLIENT_IDENT_CLASS = "flex flex-col gap-(--s1) min-w-0";
const CLIENT_NAME_CLASS = "text-[17px] font-[650] tracking-[-0.01em] [overflow-wrap:anywhere]";
const CLIENT_META_CLASS = "text-[12px] text-(--muted) tabular-nums";

const BADGE_BASE_CLASS =
	"inline-flex items-center gap-1.5 flex-none px-(--s3) py-[5px] rounded-full text-[12px] font-bold tracking-[0.05em] before:content-[''] before:w-2 before:h-2 before:rounded-full before:bg-current";

/** Same one-input rule as `badgeLabel`: the tone comes only from the label it renders. */
function badgeClassName(label: string): string {
	if (label === "ACTIVE") return `${BADGE_BASE_CLASS} bg-(--active-bg) text-(--active)`;
	if (label === "PASSIVE") return `${BADGE_BASE_CLASS} bg-(--passive-bg) text-(--passive)`;
	return `${BADGE_BASE_CLASS} bg-(--unknown-bg) text-(--unknown)`;
}

const FACTS_CLASS =
	"grid grid-cols-[max-content_minmax(0,1fr)] gap-y-(--s2) gap-x-(--s3) [@media(max-width:30rem)]:grid-cols-[minmax(0,1fr)] [@media(max-width:30rem)]:gap-0";
const FACT_DT_CLASS = "text-[11px] font-semibold uppercase tracking-[0.06em] text-(--muted) pt-0.5";
const FACT_DD_CLASS = "[overflow-wrap:anywhere] [@media(max-width:30rem)]:mb-(--s3) [@media(max-width:30rem)]:last:mb-0";

const ACTIONS_CLASS = "flex flex-col gap-(--s4) border-t border-(--border) pt-(--s5)";
// min-w-0: fieldsets carry an intrinsic min-width that refuses to shrink inside a grid track -
// without it, the roster grid reintroduces the horizontal scroll this layout exists to prevent.
const ACTION_GROUP_CLASS = "border-0 m-0 p-0 min-w-0 flex flex-col gap-(--s2)";
const LEGEND_CLASS = "p-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-(--muted)";
const CONTROLS_CLASS = "flex flex-wrap items-center gap-(--s2)";

// Split from color: a plain and a primary button both need the sizing/border-width/radius
// half, but each sets its own bg/text/border-color. Mixing both colour sets on one element
// (e.g. building the primary variant by appending its colours on top of CONTROL_CLASS's own
// bg-(--surface)/text-(--fg)) does not "override" - two same-specificity utilities touching
// the same CSS property are resolved by their order in the compiled stylesheet, not by their
// order in `class`, so bg-(--surface) can silently win over a later bg-(--fg) and hide the
// primary button's text against its own background.
const CONTROL_LAYOUT_CLASS = "[font:inherit] min-h-8 pointer-coarse:min-h-11 px-2.5 py-1 border rounded-[6px]";
const CONTROL_COLOR_CLASS = "border-(--control-border) bg-(--surface) text-(--fg)";
const CONTROL_CLASS = `${CONTROL_LAYOUT_CLASS} ${CONTROL_COLOR_CLASS}`;
const SELECT_CLASS = `${CONTROL_CLASS} select max-w-48`;
const BUTTON_EXTRA_CLASS =
	"font-[550] cursor-pointer transition-colors duration-[120ms] ease-[ease-out] motion-reduce:transition-none disabled:opacity-45 disabled:cursor-default";
const BUTTON_CLASS = `${CONTROL_CLASS} ${BUTTON_EXTRA_CLASS} enabled:hover:bg-(--bg)`;
const BUTTON_PRIMARY_CLASS =
	`${CONTROL_LAYOUT_CLASS} ${BUTTON_EXTRA_CLASS} border-(--fg) bg-(--fg) text-(--surface) ` +
	"enabled:hover:bg-(--fg-hover) enabled:hover:border-(--fg-hover)";
const REL_INPUT_CLASS = `${CONTROL_CLASS} flex-[1_1_12rem] min-w-32 placeholder:text-(--muted)`;
const KEY_INPUT_CLASS = `${CONTROL_CLASS} w-14 text-center placeholder:text-(--muted)`;

const FEEDBACK_BASE_CLASS = "text-[12px] px-(--s3) py-(--s2) rounded-[6px] [overflow-wrap:anywhere]";

/** Mirrors `badgeClassName`: the tone comes only from `feedback.tone`, one input, no blending. */
function feedbackClassName(feedback: Feedback): string {
	if (feedback === null) return FEEDBACK_BASE_CLASS;
	if (feedback.tone === "ok") return `${FEEDBACK_BASE_CLASS} bg-(--active-bg) text-(--active)`;
	if (feedback.tone === "error") return `${FEEDBACK_BASE_CLASS} bg-(--error-bg) text-(--error)`;
	return `${FEEDBACK_BASE_CLASS} bg-(--passive-bg) text-(--passive)`;
}

export function ClientPanel({ client, pushableThemes }: { client: ClientInfo; pushableThemes: string[] }) {
	// Mounted once per clientId (React keys this component by client.clientId), so this plays
	// the entrance animation exactly once - the same guarantee the vanilla version got from
	// building an `<li>` only when a client first appeared.
	const [entering, setEntering] = useState(true);

	const [activateTheme, setActivateTheme] = useState("");
	const [playTheme, setPlayTheme] = useState("");
	const [playRel, setPlayRel] = useState("");
	const [burstChar, setBurstChar] = useState("");
	const [pushTheme, setPushTheme] = useState("");
	const [pending, setPending] = useState(false);
	const [feedback, setFeedback] = useState<Feedback>(null);

	const label = badgeLabel(client.state);
	const panelClassName = clientClassName(client.state);

	// Falls back to the first pushable theme until the operator picks one; themes load
	// asynchronously and may still be empty when a panel first mounts.
	const effectiveActivateTheme = activateTheme || (pushableThemes[0] ?? "");
	const effectivePlayTheme = playTheme || (pushableThemes[0] ?? "");
	const effectivePushTheme = pushTheme || (pushableThemes[0] ?? "");

	/**
	 * `SendCommand` returning `accepted: true` means the pool queued the command, not that the
	 * client obeyed it (wrong theme name, a crashed handler, ...). Only the client's own
	 * `StateChanged`, surfacing as the next `WatchClients` snapshot, may change what the badge
	 * says - see `badgeLabel`. This mirrors the invariant `server/business/pool.test.ts`'s
	 * "Should reflect the client's acked state, not the commanded one" protects server-side.
	 * sendCommand touches `pending`/`feedback` only, and nothing else.
	 */
	async function sendCommand(action: CommandRequest["action"], actionLabel: string): Promise<void> {
		setPending(true);
		setFeedback({ tone: "pending", message: `${actionLabel}: sending…` });
		try {
			const result = await ravenAdminClient.sendCommand(
				create(CommandRequestSchema, { clientId: client.clientId, action }),
			);
			setFeedback(
				result.accepted
					? { tone: "ok", message: `${actionLabel}: accepted` }
					: { tone: "error", message: `${actionLabel}: ${result.error || "rejected"}` },
			);
		} catch (err) {
			setFeedback({ tone: "error", message: `${actionLabel}: ${describeError(err)}` });
		}
		setPending(false);
	}

	return (
		<li className={entering ? `${panelClassName} client-enter` : panelClassName} onAnimationEnd={() => setEntering(false)}>
			<div className={CLIENT_HEAD_CLASS}>
				<div className={CLIENT_IDENT_CLASS}>
					<h2 className={CLIENT_NAME_CLASS}>{client.hostname || "unnamed host"}</h2>
					<p className={CLIENT_META_CLASS} title={client.clientId}>
						{shortId(client.clientId)} · connected {formatConnectedAt(client.connectedAtUnixMs)}
					</p>
				</div>
				<span className={badgeClassName(label)}>{label}</span>
			</div>

			<dl className={FACTS_CLASS}>
				<dt className={FACT_DT_CLASS}>Theme</dt>
				<dd className={`${FACT_DD_CLASS} font-semibold`}>{client.theme || "—"}</dd>
				<dt className={FACT_DT_CLASS}>Displays</dt>
				<dd className={`${FACT_DD_CLASS} tabular-nums`}>{formatDisplays(client.displays)}</dd>
				<dt className={FACT_DT_CLASS}>Available</dt>
				<dd className={FACT_DD_CLASS}>{client.themes.join(", ") || "—"}</dd>
			</dl>

			<div className={ACTIONS_CLASS}>
				<fieldset className={ACTION_GROUP_CLASS}>
					<legend className={LEGEND_CLASS}>Session</legend>
					<div className={CONTROLS_CLASS}>
						<select
							className={SELECT_CLASS}
							aria-label="Theme to activate"
							value={effectiveActivateTheme}
							onChange={(e) => setActivateTheme(e.target.value)}
						>
							{pushableThemes.map((theme) => (
								<option key={theme} value={theme}>
									{theme}
								</option>
							))}
						</select>
						<button
							type="button"
							className={BUTTON_PRIMARY_CLASS}
							disabled={pending}
							onClick={() => void sendCommand(activateAction(effectiveActivateTheme), "Activate")}
						>
							Activate
						</button>
						<button
							type="button"
							className={BUTTON_CLASS}
							disabled={pending}
							onClick={() => void sendCommand(deactivateAction(), "Deactivate")}
						>
							Deactivate
						</button>
					</div>
				</fieldset>

				<fieldset className={ACTION_GROUP_CLASS}>
					<legend className={LEGEND_CLASS}>One-shot</legend>
					<div className={CONTROLS_CLASS}>
						<select
							className={SELECT_CLASS}
							aria-label="Theme to play a sound from"
							value={effectivePlayTheme}
							onChange={(e) => setPlayTheme(e.target.value)}
						>
							{pushableThemes.map((theme) => (
								<option key={theme} value={theme}>
									{theme}
								</option>
							))}
						</select>
						<input
							type="text"
							className={REL_INPUT_CLASS}
							aria-label="Sound file, relative to the theme"
							placeholder="rel, e.g. a/manu-a.m4a"
							value={playRel}
							onChange={(e) => setPlayRel(e.target.value)}
						/>
						<button
							type="button"
							className={BUTTON_CLASS}
							disabled={pending}
							onClick={() => void sendCommand(playAction(effectivePlayTheme, playRel), "Play sound")}
						>
							Play sound
						</button>
					</div>
					<div className={CONTROLS_CLASS}>
						<input
							type="text"
							className={KEY_INPUT_CLASS}
							aria-label="Key to burst"
							placeholder="key"
							maxLength={1}
							value={burstChar}
							onChange={(e) => setBurstChar(e.target.value.slice(0, 1))}
						/>
						<button
							type="button"
							className={BUTTON_CLASS}
							disabled={pending}
							onClick={() => void sendCommand(burstAction(burstChar), "Burst key")}
						>
							Burst key
						</button>
					</div>
				</fieldset>

				<fieldset className={ACTION_GROUP_CLASS}>
					<legend className={LEGEND_CLASS}>Sync</legend>
					<div className={CONTROLS_CLASS}>
						<select
							className={SELECT_CLASS}
							aria-label="Theme to push"
							value={effectivePushTheme}
							onChange={(e) => setPushTheme(e.target.value)}
						>
							{pushableThemes.map((theme) => (
								<option key={theme} value={theme}>
									{theme}
								</option>
							))}
						</select>
						<button
							type="button"
							className={BUTTON_CLASS}
							disabled={pending}
							onClick={() => void sendCommand(pushAction(effectivePushTheme), "Push theme")}
						>
							Push theme
						</button>
					</div>
				</fieldset>

				<div className={feedbackClassName(feedback)} role="status" aria-live="polite" hidden={feedback === null}>
					{feedback?.message}
				</div>
			</div>
		</li>
	);
}
