// Everything the progress dashboard shows, computed from the student's own saved work.

import { languageMeasures } from "./coach";
import { FOCUSES, MOVES, MOVE_IDS, REQUESTS, ROWS, ROW_IDS, type MoveId, type RowId } from "./content";
import { splitSentences } from "./match";
import { REVIEW_INTERVALS, bestStreak, counts, currentStreak, sessionsWithFeedback, wordsPerFive } from "./progress";
import type { AppState, Session } from "./types";

const ratio = (xs: ("S" | "G" | "N")[]) => {
  const s = xs.filter((x) => x === "S").length;
  const g = xs.filter((x) => x === "G").length;
  return s + g === 0 ? null : s / (s + g);
};

export function headline(state: AppState) {
  const written = state.sessions.filter((s) => counts(s) && s.mode !== "revise");
  return {
    paragraphs: written.length,
    words: written.reduce((a, s) => a + s.words, 0),
    streak: state.profile ? currentStreak(state.profile, state.sessions) : 0,
    best: state.profile ? bestStreak(state.profile, state.sessions) : 0,
    perFive: wordsPerFive(written),
    banked: state.bank.length,
    dictionary: state.dictionary.length,
    mastered: state.dictionary.filter((d) => d.step >= REVIEW_INTERVALS.length).length,
  };
}

/** For each of the five areas: how often it was shown well early on, and recently. */
export function areasThenNow(sessions: Session[]) {
  const fb = sessionsWithFeedback(sessions).filter((s) => s.mode !== "revise");
  const n = Math.min(5, Math.floor(fb.length / 2));
  const early = fb.slice(0, Math.max(n, 1));
  const late = fb.slice(-Math.max(n, 1));
  return ROW_IDS.map((row) => {
    const all = fb.map((s) => s.feedback!.rowEvidence[row] ?? "N");
    return {
      row,
      label: ROWS[row].label,
      then: n >= 2 ? ratio(early.map((s) => s.feedback!.rowEvidence[row] ?? "N")) : null,
      now: ratio(late.map((s) => s.feedback!.rowEvidence[row] ?? "N")),
      overall: ratio(all),
      tested: all.filter((x) => x !== "N").length,
    };
  });
}

/** Strengths and next steps: the areas and focuses most and least often shown well, with a quote. */
export function strengthsAndNext(sessions: Session[]) {
  const fb = sessionsWithFeedback(sessions).slice(-10);
  const strengths: { label: string; area: string; quote: string; comment: string }[] = [];
  const next: { label: string; area: string; quote: string; comment: string }[] = [];
  const seenS = new Set<string>();
  const seenN = new Set<string>();
  for (const s of [...fb].reverse()) {
    for (const st of s.feedback!.strengths) {
      if (seenS.has(st.focusId) || strengths.length >= 3) continue;
      seenS.add(st.focusId);
      strengths.push({ label: st.label, area: ROWS[st.row]?.label ?? st.row, quote: st.quote, comment: st.comment });
    }
    const w = s.feedback!.workOn;
    if (w && !seenN.has(w.focusId) && next.length < 3) {
      seenN.add(w.focusId);
      next.push({ label: w.label, area: ROWS[w.row]?.label ?? w.row, quote: w.said, comment: w.comment });
    }
  }
  return { strengths, next };
}

export function fluencySeries(sessions: Session[]) {
  return sessions
    .filter((s) => counts(s) && s.mode !== "revise" && s.writeSeconds >= 60)
    .map((s) => ({ date: s.date, value: Math.round((s.words / Math.min(s.writeSeconds, 420)) * 300), words: s.words }));
}

/** How often each paragraph move appears in what the student actually wrote (falling back to their plans). */
export function moveCounts(sessions: Session[]) {
  const c: Record<MoveId, number> = Object.fromEntries(MOVE_IDS.map((m) => [m, 0])) as Record<MoveId, number>;
  let planned = 0;
  let matched = 0;
  let fromFeedback = 0;
  for (const s of sessions) {
    const sents = s.feedback?.sentences;
    if (sents?.length) {
      fromFeedback++;
      for (const x of sents) if (x.move in c) c[x.move]++;
      if (s.outline?.length) {
        planned += s.outline.length;
        matched += s.outline.filter((o, i) => sents[i]?.move === o.move).length;
      }
    }
  }
  return {
    rows: MOVE_IDS.map((m) => ({ move: m, label: MOVES[m].label, group: MOVES[m].group, count: c[m] })),
    planMatch: planned ? matched / planned : null,
    paragraphs: fromFeedback,
  };
}

/** Focus heatmap: each of the 17 focuses across the last 12 paragraphs with feedback. */
export function focusGrid(sessions: Session[], columns = 12) {
  const fb = sessionsWithFeedback(sessions).filter((s) => s.mode !== "revise").slice(-columns);
  return {
    dates: fb.map((s) => s.date),
    rows: FOCUSES.map((f) => ({
      id: f.id,
      label: f.label,
      row: f.row,
      cells: fb.map((s) => s.feedback!.focusEvidence.find((e) => e.focusId === f.id)?.result ?? "N") as ("S" | "G" | "N")[],
    })),
  };
}

export function languageSnapshot(sessions: Session[]) {
  const written = sessions.filter((s) => counts(s) && s.mode !== "revise");
  const half = Math.max(1, Math.min(5, Math.floor(written.length / 2)));
  const avg = (xs: Session[]) => {
    const ms = xs.map((s) => languageMeasures(s.text));
    const reporting = new Set(ms.flatMap((m) => m.reporting));
    return {
      hedges: ms.length ? ms.reduce((a, m) => a + m.hedgesPer100, 0) / ms.length : 0,
      sentence: ms.length ? ms.reduce((a, m) => a + m.avgSentence, 0) / ms.length : 0,
      reportingVariety: reporting.size,
    };
  };
  return { enough: written.length >= 4, then: avg(written.slice(0, half)), now: avg(written.slice(-half)) };
}

/** Bank recall: success rate when fixing sentences from memory, by how long since the last practice. */
export function recallByGap(state: AppState) {
  const buckets = REVIEW_INTERVALS.map((g) => ({ gap: g, ok: 0, total: 0 }));
  for (const b of state.bank) {
    for (const r of b.reviews ?? []) {
      const gap = r.gap ?? 1;
      const i = buckets.findIndex((x, k) => gap <= x.gap || k === buckets.length - 1);
      buckets[i].total++;
      if (r.ok) buckets[i].ok++;
    }
  }
  return buckets;
}

/** What the student asks about, and how well their own sense of a weak sentence matches the tutor's. */
export function requestsAndCalibration(sessions: Session[]) {
  const counts: Record<string, number> = {};
  for (const s of sessions) for (const r of s.requests ?? []) counts[r] = (counts[r] ?? 0) + 1;
  const asked = REQUESTS.map((r) => ({ id: r.id, label: r.label, count: counts[r.id] ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
  let judged = 0;
  let matched = 0;
  for (const s of sessions) {
    if (s.unsure === undefined || !s.feedback?.workOn) continue;
    const said = splitSentences(s.text)[s.unsure];
    if (!said) continue;
    judged++;
    const w = s.feedback.workOn.said;
    if (said.includes(w) || w.includes(said)) matched++;
  }
  return { asked, judged, matched };
}

export const AREA_ORDER: RowId[] = [...ROW_IDS];
