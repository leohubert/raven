import { create } from "@bufbuild/protobuf";
import { createClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import {
	ActivateSchema,
	BurstKeySchema,
	ClientState,
	CommandRequestSchema,
	DeactivateSchema,
	ListPushableThemesRequestSchema,
	PlaySoundSchema,
	PushThemeSchema,
	RavenAdmin,
	WatchClientsRequestSchema,
	type ClientInfo,
	type CommandRequest,
	type Display,
} from "../../src/gen/raven/control/v1/control_pb";
import { diffClientIds } from "./roster";

const client = createClient(RavenAdmin, createGrpcWebTransport({ baseUrl: window.location.origin }));

const statusEl = document.getElementById("status") as HTMLSpanElement;
const themesNoticeEl = document.getElementById("themes-notice") as HTMLParagraphElement;
const tbody = document.getElementById("clients-body") as HTMLTableSectionElement;

let clients: ClientInfo[] = [];
let pushableThemes: string[] = [];

type Feedback = { ok: boolean; message: string } | null;

type RowState = {
	activateTheme: string;
	playTheme: string;
	playRel: string;
	burstChar: string;
	pushTheme: string;
	pending: boolean;
	feedback: Feedback;
};

const rowState = new Map<string, RowState>();

function getRowState(clientId: string): RowState {
	const existing = rowState.get(clientId);
	if (existing) return existing;
	const created: RowState = {
		activateTheme: "",
		playTheme: "",
		playRel: "",
		burstChar: "",
		pushTheme: "",
		pending: false,
		feedback: null,
	};
	rowState.set(clientId, created);
	return created;
}

/**
 * Everything a row needs to be updated in place, kept so a roster push or a command result
 * never has to recreate a `<tr>` (and with it, whatever `<select>`/`<input>` the operator is
 * mid-interaction with) just to reflect a change that belongs to that row alone, or to a
 * different row entirely.
 */
type RenderedRow = {
	tr: HTMLTableRowElement;
	hostnameCell: HTMLTableCellElement;
	displaysCell: HTMLTableCellElement;
	badgeSpan: HTMLSpanElement;
	themeCell: HTMLTableCellElement;
	themesCell: HTMLTableCellElement;
	connectedCell: HTMLTableCellElement;
	activateSelect: HTMLSelectElement;
	playSelect: HTMLSelectElement;
	pushSelect: HTMLSelectElement;
	buttons: HTMLButtonElement[];
	feedbackEl: HTMLDivElement;
};

const renderedRows = new Map<string, RenderedRow>();
let emptyRowEl: HTMLTableRowElement | null = null;

function setStatus(text: string, ok: boolean): void {
	statusEl.textContent = text;
	statusEl.className = ok ? "status status-live" : "status status-down";
}

function describeError(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
}

function shortId(id: string): string {
	return id.length > 12 ? `${id.slice(0, 12)}…` : id;
}

function formatDisplays(displays: Display[]): string {
	if (displays.length === 0) return "—";
	return displays.map((d) => `${d.width}×${d.height}@${d.scaleFactor}x`).join(", ");
}

function formatConnectedAt(unixMs: bigint): string {
	return new Date(Number(unixMs)).toLocaleString();
}

function activateAction(theme: string): CommandRequest["action"] {
	return { case: "activate", value: create(ActivateSchema, { theme }) };
}
function deactivateAction(): CommandRequest["action"] {
	return { case: "deactivate", value: create(DeactivateSchema, {}) };
}
function playAction(theme: string, rel: string): CommandRequest["action"] {
	return { case: "play", value: create(PlaySoundSchema, { theme, rel }) };
}
function burstAction(character: string): CommandRequest["action"] {
	return { case: "burst", value: create(BurstKeySchema, { character }) };
}
function pushAction(theme: string): CommandRequest["action"] {
	return { case: "push", value: create(PushThemeSchema, { theme }) };
}

/**
 * Sends a command, then updates only that row's buttons/feedback - never `render()`s the
 * table. The badge is untouched here on purpose: `SendCommand` returning `accepted: true`
 * means the pool queued the command, not that the client obeyed it (wrong theme name, a
 * crashed handler, tasks 7-9 not landed yet, ...). Only the client's own `StateChanged`,
 * surfacing as the next `WatchClients` push through `renderRoster`, may change what the
 * badge says - see the comment on `setBadge`. This is the same invariant
 * `server/business/pool.test.ts`'s "Should reflect the client's acked state, not the
 * commanded one" protects server-side.
 */
async function sendCommand(clientId: string, action: CommandRequest["action"], label: string): Promise<void> {
	const state = getRowState(clientId);
	state.pending = true;
	state.feedback = null;
	updateRowActionState(clientId);
	try {
		const result = await client.sendCommand(create(CommandRequestSchema, { clientId, action }));
		state.feedback = result.accepted
			? { ok: true, message: `${label}: accepted` }
			: { ok: false, message: `${label}: ${result.error || "rejected"}` };
	} catch (err) {
		state.feedback = { ok: false, message: `${label}: ${describeError(err)}` };
	}
	state.pending = false;
	updateRowActionState(clientId);
}

function updateRowActionState(clientId: string): void {
	const row = renderedRows.get(clientId);
	if (!row) return; // the client left the roster while its command was in flight
	const state = getRowState(clientId);
	for (const button of row.buttons) button.disabled = state.pending;
	if (state.feedback) {
		row.feedbackEl.textContent = state.feedback.message;
		row.feedbackEl.className = state.feedback.ok ? "feedback feedback-ok" : "feedback feedback-error";
		row.feedbackEl.hidden = false;
	} else {
		row.feedbackEl.hidden = true;
	}
}

function cell(text: string, title?: string): HTMLTableCellElement {
	const td = document.createElement("td");
	td.textContent = text;
	if (title) td.title = title;
	return td;
}

/**
 * The only place `ClientInfo.state` is turned into a badge. Called from row creation and
 * from `updateRosterCells` - both driven exclusively by a `WatchClients` snapshot - and
 * from nowhere in the command-sending path.
 */
function setBadge(span: HTMLSpanElement, state: ClientState): void {
	const label = state === ClientState.ACTIVE ? "ACTIVE" : state === ClientState.PASSIVE ? "PASSIVE" : "UNKNOWN";
	span.textContent = label;
	span.className = `badge badge-${label.toLowerCase()}`;
}

function populateSelect(select: HTMLSelectElement, value: string): void {
	select.replaceChildren(
		...pushableThemes.map((theme) => {
			const option = document.createElement("option");
			option.value = theme;
			option.textContent = theme;
			return option;
		}),
	);
	select.value = value || pushableThemes[0] || "";
}

function themeSelect(value: string, onChange: (value: string) => void): HTMLSelectElement {
	const select = document.createElement("select");
	populateSelect(select, value);
	select.addEventListener("change", () => onChange(select.value));
	return select;
}

function textInput(value: string, placeholder: string, onChange: (value: string) => void, maxLength?: number): HTMLInputElement {
	const input = document.createElement("input");
	input.type = "text";
	input.placeholder = placeholder;
	input.value = value;
	if (maxLength) input.maxLength = maxLength;
	input.addEventListener("input", () => onChange(input.value));
	return input;
}

function actionButton(label: string, disabled: boolean, onClick: () => void): HTMLButtonElement {
	const button = document.createElement("button");
	button.type = "button";
	button.textContent = label;
	button.disabled = disabled;
	button.addEventListener("click", onClick);
	return button;
}

function actionGroup(children: HTMLElement[]): HTMLDivElement {
	const group = document.createElement("div");
	group.className = "action-group";
	for (const child of children) group.appendChild(child);
	return group;
}

type ActionsCell = {
	td: HTMLTableCellElement;
	activateSelect: HTMLSelectElement;
	playSelect: HTMLSelectElement;
	pushSelect: HTMLSelectElement;
	buttons: HTMLButtonElement[];
	feedbackEl: HTMLDivElement;
};

/**
 * Built exactly once per row, when the client first appears - never rebuilt while the row
 * exists. A roster push updates the informational cells only (see `updateRosterCells`); a
 * command result updates only `buttons`' disabled state and `feedbackEl` (see
 * `updateRowActionState`). Neither path touches the selects/inputs built here, which is what
 * keeps an in-progress selection or a half-typed `rel`/key intact across both.
 */
function buildActionsCell(clientId: string): ActionsCell {
	const state = getRowState(clientId);
	const td = document.createElement("td");
	const wrap = document.createElement("div");
	wrap.className = "actions";
	const buttons: HTMLButtonElement[] = [];

	// Themes load once, asynchronously, and might not have arrived yet when a row is first
	// built; populateSelect(select, "") then leaves the select empty, and pushableThemes[0]
	// is undefined until loadPushableThemes calls refreshThemeOptions. sendCommand still
	// fires and any rejection (server- or client-side) surfaces as feedback rather than
	// silently no-op'ing.
	state.activateTheme ||= pushableThemes[0] ?? "";
	state.playTheme ||= pushableThemes[0] ?? "";
	state.pushTheme ||= pushableThemes[0] ?? "";

	const activateSelect = themeSelect(state.activateTheme, (v) => {
		state.activateTheme = v;
	});
	const activateButton = actionButton("Activate", state.pending, () =>
		void sendCommand(clientId, activateAction(state.activateTheme), "Activate"),
	);
	buttons.push(activateButton);
	wrap.appendChild(actionGroup([activateSelect, activateButton]));

	const deactivateButton = actionButton("Deactivate", state.pending, () =>
		void sendCommand(clientId, deactivateAction(), "Deactivate"),
	);
	buttons.push(deactivateButton);
	wrap.appendChild(actionGroup([deactivateButton]));

	const playSelect = themeSelect(state.playTheme, (v) => {
		state.playTheme = v;
	});
	const playRelInput = textInput(state.playRel, "rel, e.g. a/manu-a.m4a", (v) => {
		state.playRel = v;
	});
	const playButton = actionButton("Play sound", state.pending, () =>
		void sendCommand(clientId, playAction(state.playTheme, state.playRel), "Play sound"),
	);
	buttons.push(playButton);
	wrap.appendChild(actionGroup([playSelect, playRelInput, playButton]));

	const burstInput = textInput(
		state.burstChar,
		"key",
		(v) => {
			state.burstChar = v.slice(0, 1);
		},
		1,
	);
	const burstButton = actionButton("Burst key", state.pending, () =>
		void sendCommand(clientId, burstAction(state.burstChar), "Burst key"),
	);
	buttons.push(burstButton);
	wrap.appendChild(actionGroup([burstInput, burstButton]));

	const pushSelect = themeSelect(state.pushTheme, (v) => {
		state.pushTheme = v;
	});
	const pushButton = actionButton("Push theme", state.pending, () =>
		void sendCommand(clientId, pushAction(state.pushTheme), "Push theme"),
	);
	buttons.push(pushButton);
	wrap.appendChild(actionGroup([pushSelect, pushButton]));

	td.appendChild(wrap);

	const feedbackEl = document.createElement("div");
	feedbackEl.hidden = true;
	td.appendChild(feedbackEl);

	return { td, activateSelect, playSelect, pushSelect, buttons, feedbackEl };
}

function createRow(client: ClientInfo): RenderedRow {
	const tr = document.createElement("tr");
	const hostnameCell = cell(client.hostname || "—");
	const displaysCell = cell(formatDisplays(client.displays));
	const badgeTd = document.createElement("td");
	const badgeSpan = document.createElement("span");
	setBadge(badgeSpan, client.state);
	badgeTd.appendChild(badgeSpan);
	const themeCell = cell(client.theme || "—");
	const themesCell = cell(client.themes.join(", ") || "—");
	const connectedCell = cell(formatConnectedAt(client.connectedAtUnixMs));
	const actions = buildActionsCell(client.clientId);

	tr.append(
		cell(shortId(client.clientId), client.clientId),
		hostnameCell,
		displaysCell,
		badgeTd,
		themeCell,
		themesCell,
		connectedCell,
		actions.td,
	);

	return {
		tr,
		hostnameCell,
		displaysCell,
		badgeSpan,
		themeCell,
		themesCell,
		connectedCell,
		activateSelect: actions.activateSelect,
		playSelect: actions.playSelect,
		pushSelect: actions.pushSelect,
		buttons: actions.buttons,
		feedbackEl: actions.feedbackEl,
	};
}

function updateRosterCells(row: RenderedRow, client: ClientInfo): void {
	row.hostnameCell.textContent = client.hostname || "—";
	row.displaysCell.textContent = formatDisplays(client.displays);
	setBadge(row.badgeSpan, client.state);
	row.themeCell.textContent = client.theme || "—";
	row.themesCell.textContent = client.themes.join(", ") || "—";
	row.connectedCell.textContent = formatConnectedAt(client.connectedAtUnixMs);
}

function buildEmptyRow(): HTMLTableRowElement {
	const row = document.createElement("tr");
	const td = document.createElement("td");
	td.colSpan = 8;
	td.className = "empty";
	td.textContent = "No clients connected.";
	row.appendChild(td);
	return row;
}

function refreshThemeOptions(): void {
	for (const [clientId, row] of renderedRows) {
		const state = getRowState(clientId);
		populateSelect(row.activateSelect, state.activateTheme);
		populateSelect(row.playSelect, state.playTheme);
		populateSelect(row.pushSelect, state.pushTheme);
	}
}

/**
 * Row-scoped: only clients that newly appeared get a `<tr>` built, only clients that left
 * get theirs removed, and every other row is patched in place via `updateRosterCells`
 * (never recreated). This is what makes clicking a button in one row - or any roster churn
 * elsewhere - leave every other row's in-progress `<select>`/`<input>` state and focus
 * completely alone; the previous full `tbody.replaceChildren(...)` on every push (and on
 * every `sendCommand` too) recreated every row's inputs regardless of which one changed.
 */
function renderRoster(): void {
	if (clients.length === 0) {
		for (const row of renderedRows.values()) row.tr.remove();
		renderedRows.clear();
		rowState.clear();
		if (!emptyRowEl) {
			emptyRowEl = buildEmptyRow();
			tbody.replaceChildren(emptyRowEl);
		}
		return;
	}

	if (emptyRowEl) {
		emptyRowEl.remove();
		emptyRowEl = null;
	}

	const { removed } = diffClientIds(new Set(renderedRows.keys()), clients);
	for (const id of removed) {
		renderedRows.get(id)?.tr.remove();
		renderedRows.delete(id);
		rowState.delete(id);
	}

	let previousTr: HTMLTableRowElement | null = null;
	for (const client of clients) {
		let row = renderedRows.get(client.clientId);
		if (!row) {
			row = createRow(client);
			renderedRows.set(client.clientId, row);
		} else {
			updateRosterCells(row, client);
		}

		// Only actually moves the row when the roster's order changed - the common case
		// (no reorder) touches the DOM position not at all.
		const expected: Element | null = previousTr ? previousTr.nextElementSibling : tbody.firstElementChild;
		if (expected !== row.tr) {
			if (previousTr) previousTr.after(row.tr);
			else tbody.prepend(row.tr);
		}
		previousTr = row.tr;
	}
}

async function loadPushableThemes(): Promise<void> {
	try {
		const result = await client.listPushableThemes(create(ListPushableThemesRequestSchema, {}));
		pushableThemes = result.themes;
		themesNoticeEl.hidden = true;
		refreshThemeOptions();
	} catch (err) {
		themesNoticeEl.textContent = `Could not load pushable themes: ${describeError(err)}`;
		themesNoticeEl.hidden = false;
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const MIN_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 15_000;

/**
 * `WatchClients` is a live gRPC-Web stream, not a one-shot fetch: a server restart, a
 * dropped connection, or a proxy hiccup ends the `for await` loop rather than throwing
 * cleanly every time. Without a retry, this page would go quietly stale - showing whatever
 * roster it last saw with no indication it is no longer live. So this loops forever,
 * reconnecting with backoff and surfacing connection state via `#status`.
 */
async function watchRoster(): Promise<void> {
	let backoff = MIN_BACKOFF_MS;
	for (;;) {
		try {
			for await (const roster of client.watchClients(create(WatchClientsRequestSchema, {}))) {
				backoff = MIN_BACKOFF_MS;
				setStatus("live", true);
				clients = roster.clients;
				renderRoster();
			}
		} catch (err) {
			console.error("[raven-dashboard] watchClients error:", err);
		}
		setStatus(`disconnected, retrying in ${Math.round(backoff / 1000)}s`, false);
		await sleep(backoff);
		backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
	}
}

setStatus("connecting…", false);
void loadPushableThemes();
void watchRoster();
