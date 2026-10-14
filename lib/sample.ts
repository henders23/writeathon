"use client";

import { FALLBACK_HUNT, ROW_IDS, type RowId } from "./content";
import { addDays, dayKey } from "./dates";
import { todaysPrompt } from "./progress";
import { getState, newId, update } from "./store";
import type { BankItem, Evidence, Feedback, Session } from "./types";

// A believable three-week history so the Pattern, Bank, recap and streak screens can be demonstrated.
const EV: Record<RowId, string> = {
  argument: "GSNGSSGSNSSGNSGSSNGSSN",
  organisation: "GGGGNGGSNGGSGGNGGSGNSS",
  sources: "NGNNGSNGSNNGSNGSNSGNSS",
  range: "SSNSGSGSSNSSGNSSGSSNSS",
  accuracy: "GSNGSSGSNSSGNSGSSNGSSG",
};
const TOPIC = ["G", "G", "S", "G", "S", "S"];

const PARAS = [
  {
    text: "Recorded lectures have many advantages for international students. Students can pause and replay difficult parts, which is useful when the lecturer speaks quickly. However, there is some evidence that students who rely only on recordings attend less and fall behind. This suggests that recordings work best as a support for live teaching rather than a replacement for it.",
    strong: ["Students can pause and replay difficult parts, which is useful when the lecturer speaks quickly.", "This suggests that recordings work best as a support for live teaching rather than a replacement for it."],
    weak: "Recorded lectures have many advantages for international students.",
    fixed: "The main advantage of recorded lectures for international students is the chance to review difficult content.",
  },
  {
    text: "Group projects are a common form of assessment in engineering. They prepare students for professional teamwork, as most engineering problems are solved by teams. Admittedly, some students contribute less than others. However, peer assessment can reduce this problem because each member rates the others. For this reason, group projects can be fair if they are designed carefully.",
    strong: ["Admittedly, some students contribute less than others. However, peer assessment can reduce this problem because each member rates the others.", "For this reason, group projects can be fair if they are designed carefully."],
    weak: "Group projects are a common form of assessment in engineering.",
    fixed: "Group projects can be a fair form of assessment in engineering if they include peer assessment.",
  },
];

export function loadSampleHistory() {
  const today = dayKey();
  const profile = getState().profile;
  if (!profile) return;
  const days = Array.from({ length: 23 }, (_, i) => addDays(today, i - 23)).filter((d) => d !== addDays(today, -5));
  const bank: BankItem[] = [];
  const sessions: Session[] = days.map((date, i) => {
    const focusId = i < 6 ? "topic-sentence" : "hedging";
    const p = PARAS[i % PARAS.length];
    const rowEvidence = Object.fromEntries(ROW_IDS.map((r) => [r, EV[r][i] as Evidence])) as Record<RowId, Evidence>;
    const hedgingGood = i >= days.length - 2;
    const focusEvidence: Feedback["focusEvidence"] =
      i < 6 ? [{ focusId: "topic-sentence", result: TOPIC[i] as "S" | "G" }] : [{ focusId: "hedging", result: hedgingGood ? "S" : "G" }];
    if (i >= 6) focusEvidence.push({ focusId: "topic-sentence", result: "S" });
    if (i % 4 === 1) focusEvidence.push({ focusId: "citing", result: "G" });
    if (i % 5 === 2) focusEvidence.push({ focusId: "conceding", result: "S" });
    const prompt = todaysPrompt(profile, date);
    const isHunt = i === 14 || i === 19;
    const id = newId();
    const workOn: Feedback["workOn"] =
      i < 6
        ? { row: "organisation", focusId: "topic-sentence", label: "Topic sentences", said: p.weak, clue: "This opening is very general. What exactly will the paragraph argue?", pattern: "The main drawback of online exams is the difficulty of preventing collusion.", try: p.fixed, comment: "A specific topic sentence tells the reader what to expect." }
        : { row: "argument", focusId: "hedging", label: "Hedging claims", said: "They prepare students for professional teamwork, as most engineering problems are solved by teams.", clue: "‘Most’ is a strong claim. How sure can you be?", pattern: "Many urban problems appear to require cooperation between agencies.", try: "They may prepare students for professional teamwork, as many engineering problems are solved by teams.", comment: "Qualify claims you can't fully support." };
    const feedback: Feedback = {
      summary: "A clear, well-organised paragraph with a definite point.",
      strengths: [
        { row: "argument", focusId: "conceding", label: "Conceding and countering", quote: p.strong[0], comment: "You admitted a weakness and then answered it." },
        { row: "organisation", focusId: "concluding", label: "Ending with the ‘so what’", quote: p.strong[1], comment: "Your last sentence says why the point matters." },
      ],
      workOn,
      rowEvidence,
      focusEvidence,
      focusUsedCount: hedgingGood ? 2 : 0,
      focusPhrasesUsed: hedgingGood ? ["there is some evidence that", "may"] : [],
      focusQuote: hedgingGood ? "However, there is some evidence that students who rely only on recordings attend less and fall behind." : i < 6 && TOPIC[i] === "S" ? p.fixed : "",
      nextFocusSuggestion: "citing",
      hunt: isHunt
        ? FALLBACK_HUNT.map((h, k) => ({ item: h.phrase, verdict: k === 4 ? "missed" : k === 2 ? "close" : "natural", quote: k === 4 ? "" : h.example, note: k === 2 ? "Use ‘Admittedly’ to concede before a ‘However’." : "Used naturally." }))
        : [],
      transfer: i === days.length - 1 ? [{ label: "Topic sentences", quote: p.fixed }] : [],
    };
    if (i === 2 || i === 9 || i === 16) {
      bank.push({ id: newId(), date, sessionId: id, row: workOn!.row, focusId: workOn!.focusId, label: workOn!.label, before: workOn!.said, after: workOn!.try, reused: i === 2 ? 1 : 0 });
    }
    return {
      id,
      date,
      startedAt: `${date}T19:${String(10 + (i % 40)).padStart(2, "0")}:00.000Z`,
      mode: isHunt ? "hunt" : "write",
      discipline: profile.discipline,
      promptId: prompt.id,
      task: prompt.task,
      topic: prompt.topic,
      promptText: prompt.text,
      source: prompt.source,
      focusId,
      plan: { claim: "", support: "", soWhat: "" },
      text: p.text,
      words: 70 + Math.min(60, i * 3),
      writeSeconds: 300,
      deletions: 20,
      pasteBlocked: 0,
      huntItems: isHunt ? FALLBACK_HUNT : undefined,
      hintsUsed: isHunt ? [1] : undefined,
      feedback,
      banked: i === 2 || i === 9 || i === 16,
      sample: true,
    };
  });
  const ids = new Set(sessions.map((s) => s.id));
  update((s) => ({
    ...s,
    sessions: [...s.sessions.filter((x) => !x.sample), ...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
    bank: [...s.bank.filter((b) => !ids.has(b.sessionId)), ...bank].sort((a, b) => a.date.localeCompare(b.date)),
    profile: s.profile
      ? { ...s.profile, focus: { id: "hedging", since: days[6] }, frozenDates: [...new Set([...s.profile.frozenDates, addDays(today, -5)])] }
      : s.profile,
  }));
}

export function clearSampleHistory() {
  const today = dayKey();
  update((s) => {
    const sampleIds = new Set(s.sessions.filter((x) => x.sample).map((x) => x.id));
    return {
      ...s,
      sessions: s.sessions.filter((x) => !x.sample),
      bank: s.bank.filter((b) => !sampleIds.has(b.sessionId)),
      profile: s.profile ? { ...s.profile, frozenDates: s.profile.frozenDates.filter((d) => d !== addDays(today, -5)) } : s.profile,
    };
  });
}
