import { WARMUPS, choicesFor, findPrompt, promptFor } from "./bank";
import type { DailyPrompt } from "./bank/types";
import { FIRST_FOCUS, FOCUSES, FOCUS_BY_ID, MIN_WORDS_TO_COUNT, NO_SOURCE_STAND_IN, ROW_IDS, type RowId } from "./content";
import { addDays, dayKey, daysBetween } from "./dates";
import type { AppState, BankItem, DictEntry, Evidence, Profile, Session, SurgeryRun } from "./types";

/* ---------- Today's prompt and focus ---------- */

export function todaysPrompt(profile: Profile, date: string = dayKey()): DailyPrompt {
  return promptFor(profile.discipline, date);
}

/** Today's three topics. A student's first two paragraphs use the accessible warm-ups. */
export function todaysChoices(profile: Profile, sessions: Session[], date: string = dayKey()): DailyPrompt[] {
  const written = sessions.filter((s) => counts(s) && s.mode !== "revise" && !s.sample).length;
  if (written < 2 && sessions.every((s) => !s.sample)) return WARMUPS;
  return choicesFor(profile.discipline, date);
}

export function getTopic(id: string, state: AppState): DailyPrompt | undefined {
  return state.customPrompts.find((p) => p.id === id) ?? findPrompt(id);
}

/** The focus actually practised today: a Sources focus rests on days with no source. */
export function focusForDay(profile: Profile, prompt: DailyPrompt): string {
  const f = FOCUS_BY_ID[profile.focus.id] ?? FOCUS_BY_ID[FIRST_FOCUS];
  if (f.needsSource && !prompt.source) return NO_SOURCE_STAND_IN;
  return f.id;
}

/* ---------- Streaks ---------- */

// A day counts once the student has submitted a paragraph of at least 40 words.
export function counts(s: Session) {
  return s.words >= MIN_WORDS_TO_COUNT;
}

export function activeDays(sessions: Session[]): Set<string> {
  return new Set(sessions.filter(counts).map((s) => s.date));
}

export const MAX_FREEZES = 2;

export function freezesAvailable(profile: Profile, sessions: Session[]): number {
  const earned = Math.floor(activeDays(sessions).size / 7);
  return Math.max(0, Math.min(MAX_FREEZES, earned - profile.frozenDates.length));
}

/**
 * Spend streak freezes on missed days since the student last wrote.
 * Returns an updated profile if anything changed, otherwise null.
 */
export function reconcileFreezes(state: AppState, today: string = dayKey()): Profile | null {
  const { profile, sessions } = state;
  if (!profile) return null;
  const active = activeDays(sessions);
  if (active.size === 0) return null;
  const covered = [...active, ...profile.frozenDates].sort();
  let day = addDays(covered[covered.length - 1], 1);
  const yesterday = addDays(today, -1);
  const frozen = [...profile.frozenDates];
  let available = freezesAvailable(profile, sessions);
  let changed = false;
  while (day <= yesterday) {
    if (!active.has(day)) {
      if (available <= 0) break;
      frozen.push(day);
      available--;
      changed = true;
    }
    day = addDays(day, 1);
  }
  return changed ? { ...profile, frozenDates: frozen } : null;
}

export function currentStreak(profile: Profile, sessions: Session[], today: string = dayKey()): number {
  const active = activeDays(sessions);
  const frozen = new Set(profile.frozenDates);
  let day = active.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (active.has(day) || frozen.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export function bestStreak(profile: Profile, sessions: Session[]): number {
  const days = [...new Set([...activeDays(sessions), ...profile.frozenDates])].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export type DayStatus = "done" | "frozen" | "pending" | "empty";
export function lastSevenDays(profile: Profile, sessions: Session[], today: string = dayKey()) {
  const active = activeDays(sessions);
  const frozen = new Set(profile.frozenDates);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    const status: DayStatus = active.has(date) ? "done" : frozen.has(date) ? "frozen" : date === today ? "pending" : "empty";
    return { date, status, isToday: date === today };
  });
}

export const MILESTONES = [
  { days: 7, label: "First week" },
  { days: 14, label: "Fortnight" },
  { days: 30, label: "Month" },
  { days: 100, label: "Term" },
];

/* ---------- Focus selection ---------- */

export function sessionsWithFeedback(sessions: Session[]) {
  return sessions.filter((s) => s.feedback);
}

/**
 * After each paragraph, decide whether to keep the current focus or move on.
 * A focus is secured once it is used well in two paragraphs in a row on that focus,
 * and we move on anyway after five, so it can come back later.
 */
export function nextFocusAfter(profile: Profile, sessions: Session[]): Profile["focus"] {
  const current = profile.focus.id;
  const onFocus = sessionsWithFeedback(sessions).filter((s) => s.focusId === current);
  const lastTwo = onFocus.slice(-2);
  const secured =
    lastTwo.length === 2 &&
    lastTwo.every((s) => s.feedback!.focusEvidence.some((e) => e.focusId === current && e.result === "S"));
  if (!secured && onFocus.length < 5) return profile.focus;

  // Score candidate focuses by recent gaps.
  const recent = sessionsWithFeedback(sessions).slice(-10);
  const score: Record<string, number> = {};
  for (const s of recent) {
    const fb = s.feedback!;
    for (const e of fb.focusEvidence) if (e.result === "G") score[e.focusId] = (score[e.focusId] ?? 0) + 2;
    if (fb.workOn) score[fb.workOn.focusId] = (score[fb.workOn.focusId] ?? 0) + 3;
    if (FOCUS_BY_ID[fb.nextFocusSuggestion]) score[fb.nextFocusSuggestion] = (score[fb.nextFocusSuggestion] ?? 0) + 1;
    for (const row of ROW_IDS) {
      if (fb.rowEvidence[row] === "G") {
        for (const f of FOCUSES.filter((x) => x.row === row)) score[f.id] = (score[f.id] ?? 0) + 0.5;
      }
    }
  }
  delete score[current];
  const ranked = Object.entries(score).filter(([id]) => FOCUS_BY_ID[id]).sort((a, b) => b[1] - a[1]);
  const fallbackIdx = (FOCUSES.findIndex((f) => f.id === current) + 1) % FOCUSES.length;
  const nextId = ranked[0]?.[0] ?? FOCUSES[fallbackIdx]?.id ?? FIRST_FOCUS;
  return { id: nextId, since: dayKey() };
}

/* ---------- Pattern ---------- */

export const GRID_COLUMNS = 12;

export type RowStatus = "Strength" | "Improving" | "Developing" | "Steady" | "Not enough yet";

export function patternRows(profile: Profile, sessions: Session[]) {
  const withFb = sessionsWithFeedback(sessions).slice(-GRID_COLUMNS);
  return ROW_IDS.map((row) => {
    const ev: Evidence[] = withFb.map((s) => s.feedback!.rowEvidence[row] ?? "N");
    const cells: (Evidence | "")[] = [...Array(GRID_COLUMNS - ev.length).fill(""), ...ev];
    return { row, cells, status: rowStatus(ev), note: rowNote(row, ev, withFb) };
  });
}

function rowStatus(ev: Evidence[]): RowStatus {
  const s = ev.filter((e) => e === "S").length;
  const g = ev.filter((e) => e === "G").length;
  if (s + g < 3) return "Not enough yet";
  const half = Math.floor(ev.length / 2);
  const early = ev.slice(0, half);
  const late = ev.slice(half);
  const ratio = (a: Evidence[]) => {
    const ss = a.filter((e) => e === "S").length;
    const gg = a.filter((e) => e === "G").length;
    return ss + gg === 0 ? null : ss / (ss + gg);
  };
  const er = ratio(early);
  const lr = ratio(late);
  if (s >= 3 && s >= 2 * g && (lr === null || lr >= 0.6)) return "Strength";
  if (er !== null && lr !== null && lr - er >= 0.3) return "Improving";
  if (g > s) return "Developing";
  return "Steady";
}

function rowNote(row: RowId, ev: Evidence[], sessions: Session[]): string {
  const s = ev.filter((e) => e === "S").length;
  const tested = ev.filter((e) => e !== "N").length;
  const parts: string[] = [];
  if (tested === 0) parts.push("Not tested yet. It will show up as you write more paragraphs.");
  else parts.push(`Shown well in ${s} of the ${tested} paragraph${tested === 1 ? "" : "s"} where it came up.`);
  for (let i = sessions.length - 1; i >= 0; i--) {
    const fb = sessions[i].feedback!;
    const str = fb.strengths.find((x) => x.row === row);
    if (fb.workOn?.row === row) {
      parts.push(`Most recently: ${fb.workOn.comment}`);
      break;
    }
    if (str) {
      parts.push(`Most recently: ${str.comment}`);
      break;
    }
  }
  return parts.join(" ");
}

export type ChipKind = "strength" | "develop" | "current" | "neutral";
export function focusChips(row: RowId, profile: Profile, sessions: Session[]) {
  const latest: Record<string, "S" | "G"> = {};
  for (const s of sessionsWithFeedback(sessions)) {
    for (const e of s.feedback!.focusEvidence) latest[e.focusId] = e.result;
  }
  return FOCUSES.filter((f) => f.row === row).map((f) => {
    const kind: ChipKind =
      f.id === profile.focus.id ? "current" : latest[f.id] === "S" ? "strength" : latest[f.id] === "G" ? "develop" : "neutral";
    return { id: f.id, label: f.id === profile.focus.id ? `${f.label} · now` : f.label, kind };
  });
}

/* ---------- Writing fluency ---------- */

/** Average words per five minutes of writing, for a set of sessions. */
export function wordsPerFive(sessions: Session[]): number | null {
  const valid = sessions.filter((s) => counts(s) && s.mode !== "revise" && s.writeSeconds >= 60);
  if (!valid.length) return null;
  const rates = valid.map((s) => (s.words / Math.min(s.writeSeconds, 420)) * 300);
  return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
}

export function fluencyTrend(sessions: Session[], today: string = dayKey()) {
  const counted = sessions.filter(counts);
  if (counted.length < 2) return null;
  const start = counted[0].date;
  const firstWeek = counted.filter((s) => daysBetween(start, s.date) < 7);
  const thisWeek = counted.filter((s) => s.date >= addDays(today, -6));
  const then = wordsPerFive(firstWeek);
  const now = wordsPerFive(thisWeek);
  if (then === null || now === null) return null;
  return { then, now };
}

/* ---------- Weekly recap ---------- */

export function weeklyRecap(profile: Profile, sessions: Session[], today: string = dayKey()) {
  const weekAgo = addDays(today, -6);
  const week = sessions.filter((s) => s.date >= weekAgo && counts(s));
  if (week.length === 0) return null;
  const words = week.reduce((a, s) => a + s.words, 0);
  const start = sessions.find(counts)?.date ?? today;
  const weekNumber = Math.floor(daysBetween(start, today) / 7) + 1;

  // Then vs now for a focus the student has worked on: earliest "you wrote" vs latest good use.
  const withFb = sessionsWithFeedback(sessions);
  let thenNow: { focusLabel: string; then: string; now: string } | null = null;
  const candidates = [profile.focus.id, ...new Set(withFb.map((s) => s.focusId).reverse())];
  for (const fid of candidates) {
    const thenS = withFb.find((s) => s.feedback!.workOn?.focusId === fid && s.feedback!.workOn.said);
    const nowS = [...withFb].reverse().find((s) => s.focusId === fid && s.feedback!.focusQuote);
    if (thenS && nowS && nowS.startedAt > thenS.startedAt) {
      thenNow = { focusLabel: FOCUS_BY_ID[fid]?.label ?? fid, then: thenS.feedback!.workOn!.said, now: nowS.feedback!.focusQuote };
      break;
    }
  }
  const headline = thenNow
    ? `You’re getting better at ${thenNow.focusLabel.toLowerCase()}.`
    : `${week.length} paragraph${week.length === 1 ? "" : "s"} this week.`;
  return { weekNumber, paragraphs: week.length, words, headline, thenNow, fluency: fluencyTrend(sessions, today) };
}

/* ---------- Games ---------- */

export function huntScore(session: Session) {
  const results = session.feedback?.hunt ?? [];
  const pts = results.reduce((a, r) => a + (r.verdict === "natural" ? 3 : r.verdict === "close" ? 1 : 0), 0);
  const hints = session.hintsUsed?.length ?? 0;
  return { points: Math.max(0, pts - hints), max: (session.huntItems?.length ?? 5) * 3, hints };
}

export function bestHuntThisWeek(sessions: Session[], today: string = dayKey()) {
  const weekAgo = addDays(today, -6);
  const scores = sessions.filter((s) => s.mode === "hunt" && s.feedback && s.date >= weekAgo).map((s) => huntScore(s).points);
  return scores.length ? Math.max(...scores) : null;
}

export function bestSurgeryThisWeek(runs: SurgeryRun[], today: string = dayKey()) {
  const weekAgo = addDays(today, -6);
  const scores = runs.filter((r) => r.date >= weekAgo).map((r) => r.points);
  return scores.length ? Math.max(...scores) : null;
}

/* ---------- Bank: spaced retrieval ---------- */

/** Days until the next review after each successful recall. */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

export function bankDue(b: BankItem): string | null {
  if ((b.step ?? 0) >= REVIEW_INTERVALS.length) return null; // mastered
  return b.due ?? addDays(b.date, REVIEW_INTERVALS[0]);
}

export function dueBankItems(bank: BankItem[], today: string = dayKey(), limit = 3): BankItem[] {
  return bank
    .filter((b) => {
      const due = bankDue(b);
      return due !== null && due <= today && b.date < today;
    })
    .sort((a, b) => (bankDue(a) ?? "").localeCompare(bankDue(b) ?? ""))
    .slice(0, limit);
}

/** Move a banked item along (or back to the start of) its review schedule. */
export function scheduleAfterReview(b: BankItem, ok: boolean, today: string = dayKey()): BankItem {
  const reviews = [...(b.reviews ?? []), { date: today, ok, gap: REVIEW_INTERVALS[Math.min(b.step ?? 0, REVIEW_INTERVALS.length - 1)] }];
  if (!ok) return { ...b, reviews, step: 0, due: addDays(today, REVIEW_INTERVALS[0]) };
  const step = (b.step ?? 0) + 1;
  const due = step >= REVIEW_INTERVALS.length ? undefined : addDays(today, REVIEW_INTERVALS[step]);
  return { ...b, reviews, step, due };
}

export function nextReviewLabel(b: BankItem, today: string = dayKey()): string {
  const due = bankDue(b);
  if (!due) return "Mastered: no more reviews needed.";
  const n = daysBetween(today, due);
  return n <= 0 ? "Due now" : n === 1 ? "Next review tomorrow" : `Next review in ${n} days`;
}

/* ---------- Task repetition: beat your last attempt ---------- */

/** The student's most recent earlier paragraph on the same prompt (prompts recur every 12 days). */
export function lastAttempt(sessions: Session[], promptId: string, before: string): Session | null {
  return (
    [...sessions]
      .reverse()
      .find((s) => s.promptId === promptId && s.mode !== "revise" && s.date < before && counts(s)) ?? null
  );
}

export function areasShownWell(s: Session): number | null {
  if (!s.feedback) return null;
  return ROW_IDS.filter((r) => s.feedback!.rowEvidence[r] === "S").length;
}

/* ---------- Weekly revision day ---------- */

/** Paragraphs from the last 7 days that could be revised (have feedback, not yet revised). */
export function revisionCandidates(sessions: Session[], today: string = dayKey()): Session[] {
  const revised = new Set(sessions.filter((s) => s.mode === "revise").map((s) => s.revisionOf));
  return sessions
    .filter((s) => s.mode !== "revise" && s.feedback && s.date >= addDays(today, -6) && s.date < today && !revised.has(s.id))
    .reverse();
}

/** Revision day comes round once a week, once there are at least two paragraphs to choose from. */
export function revisionDue(sessions: Session[], today: string = dayKey()): boolean {
  const recentRevision = sessions.some((s) => s.mode === "revise" && s.date > addDays(today, -7));
  return !recentRevision && revisionCandidates(sessions, today).length >= 2;
}

/* ---------- Dictionary: spaced quizzes ---------- */

export function dictDue(entries: DictEntry[], today: string = dayKey()): DictEntry[] {
  return entries.filter((e) => e.step < REVIEW_INTERVALS.length && e.due <= today).sort((a, b) => a.due.localeCompare(b.due));
}

export function scheduleDict(e: DictEntry, ok: boolean, type: DictEntry["reviews"][number]["type"], today: string = dayKey()): DictEntry {
  const reviews = [...e.reviews, { date: today, ok, type }];
  if (!ok) return { ...e, reviews, step: Math.max(0, e.step - 1), due: addDays(today, 1) };
  const step = e.step + 1;
  return { ...e, reviews, step, due: step >= REVIEW_INTERVALS.length ? "9999-12-31" : addDays(today, REVIEW_INTERVALS[step]) };
}
