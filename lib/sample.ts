"use client";

import { WARMUPS } from "./bank";
import { FALLBACK_HUNT, ROW_IDS, type MoveId, type RowId } from "./content";
import { addDays, dayKey } from "./dates";
import { wordCount } from "./match";
import { REVIEW_INTERVALS } from "./progress";
import { getState, newId, update } from "./store";
import type { BankItem, DictEntry, Evidence, Feedback, OutlineStep, QuizType, SentenceNote, Session, Strength, WorkOn } from "./types";

// A believable three-week history so the Progress, Bank, Dictionary, recap and streak screens can be
// demonstrated. The paragraphs answer the three warm-up tasks, so every quote and citation is coherent
// with a genuine source.

const EV: Record<RowId, string> = {
  argument: "GSNGSSGSNSSGNSGSSNGSSN",
  organisation: "GGGGNGGSNGGSGGNGGSGNSS",
  sources: "NGNNGSNGSNNGSNGSNSGNSS",
  range: "SSNSGSGSSNSSGNSSGSSNSS",
  accuracy: "GSNGSSGSNSSGNSGSSNGSSG",
};
const TOPIC = ["G", "G", "S", "G", "S", "S"];

type Rewrite = { said: string; try: string; clue: string; pattern: string; comment: string };
type Para = {
  moves: MoveId[];
  sentences: string[]; // the improved version of each sentence
  strengths: [number, Omit<Strength, "quote">][];
  topic: Rewrite; // sentence 0, while practising topic sentences
  hedge: { idx: number } & Rewrite; // an overclaim, while practising hedging
  extra: { idx: number; row: RowId; focusId: string; label: string } & Rewrite; // once hedging is secure
  model: string;
};

const PARAS: Para[] = [
  {
    moves: ["claim", "evidence", "explain", "concede", "sowhat"],
    sentences: [
      "Losing sleep to study more is usually a poor trade for students.",
      "Okano et al. (2019) found that students who slept longer and more consistently tended to get better grades.",
      "This suggests that sleep may be one important factor in academic success.",
      "Admittedly, a late night before a deadline is sometimes unavoidable.",
      "For this reason, students should plan their work so that losing sleep becomes the exception rather than the habit.",
    ],
    strengths: [
      [1, { row: "sources", focusId: "citing", label: "Citing accurately", comment: "You cite the study in the right form and report what it found, in your own words." }],
      [4, { row: "organisation", focusId: "concluding", label: "Ending with the ‘so what’", comment: "Your last sentence tells the reader what to do with your point." }],
    ],
    topic: {
      said: "Sleep is important for students.",
      try: "Losing sleep to study more is usually a poor trade for students.",
      clue: "This is true, but very general. What is your answer to the question?",
      pattern: "Cutting lectures to work extra shifts is rarely worth it for first-year students.",
      comment: "A topic sentence should answer the question, so the reader knows your position at once.",
    },
    hedge: {
      idx: 2,
      said: "This shows that sleep is the only thing that decides academic success.",
      try: "This suggests that sleep may be one important factor in academic success.",
      clue: "‘The only thing’ claims much more than one study can show.",
      pattern: "This suggests that class size may be one factor in student satisfaction.",
      comment: "One correlational study can’t show that sleep is the only cause. Qualify the claim.",
    },
    extra: {
      idx: 3,
      row: "accuracy",
      focusId: "articles-nouns",
      label: "Articles and plurals",
      said: "Admittedly, late night before deadline is sometimes unavoidable.",
      try: "Admittedly, a late night before a deadline is sometimes unavoidable.",
      clue: "Two singular countable nouns here are missing a small word.",
      pattern: "Admittedly, a delay in the timetable is sometimes unavoidable.",
      comment: "‘Night’ and ‘deadline’ are countable, so they need ‘a’.",
    },
    model:
      "Sacrificing sleep for extra study time is likely to be counter-productive. Okano et al. (2019) report that students whose sleep was longer, better and more regular tended to achieve higher grades, with sleep accounting for almost a quarter of the variation in performance. Although this does not prove that sleep causes better results, it suggests that tired students may learn less from each extra hour. Students would therefore be wise to protect their sleep and plan revision earlier instead.",
  },
  {
    moves: ["claim", "explain", "evidence", "sowhat"],
    sentences: [
      "Studying alone first and then with a group appears to combine the strengths of both.",
      "Studying alone allows students to work at their own pace, while a group lets them test their understanding by explaining ideas to others.",
      "Song et al. (2025) found that students who prepared individually before collaborating performed better than those who used only one approach.",
      "This suggests that the most effective approach is not alone or together, but both, in that order.",
    ],
    strengths: [
      [1, { row: "organisation", focusId: "linking", label: "Linking ideas", comment: "‘While’ sets the two ways side by side, so the comparison is easy to follow." }],
      [3, { row: "organisation", focusId: "concluding", label: "Ending with the ‘so what’", comment: "You draw out the practical point of the comparison." }],
    ],
    topic: {
      said: "There are different ways to study.",
      try: "Studying alone first and then with a group appears to combine the strengths of both.",
      clue: "The reader knows this already. Which way is better, according to you?",
      pattern: "Reading the textbook before a lecture appears to make the lecture far more useful.",
      comment: "Start with your comparison’s answer, not a general fact.",
    },
    hedge: {
      idx: 2,
      said: "Song et al. (2025) prove that group study is always better when students prepare first.",
      try: "Song et al. (2025) found that students who prepared individually before collaborating performed better than those who used only one approach.",
      clue: "‘Prove’ and ‘always’ claim more than one study can show.",
      pattern: "Lee (2021) found that students who previewed slides tended to ask more questions.",
      comment: "Report what the study found, and choose a verb that matches its strength.",
    },
    extra: {
      idx: 1,
      row: "range",
      focusId: "register",
      label: "Academic register",
      said: "Studying alone lets students go at their own pace, but a group is really good for testing what you know.",
      try: "Studying alone allows students to work at their own pace, while a group lets them test their understanding by explaining ideas to others.",
      clue: "‘Really good’ and ‘you’ sound like speech.",
      pattern: "Online quizzes allow students to check their understanding without pressure.",
      comment: "Swap the spoken phrases for precise, formal ones.",
    },
    model:
      "The most effective approach appears to be individual study followed by group work. Working alone gives students time to understand the material at their own pace, whereas discussion exposes gaps when they try to explain ideas to peers. Song et al. (2025) found that participants who prepared individually before collaborating outperformed those who only studied alone or only in groups. Students may therefore gain most by treating group sessions as a test of their own preparation, rather than a replacement for it.",
  },
  {
    moves: ["claim", "summarise", "explain", "concede", "sowhat"],
    sentences: [
      "Students do not necessarily need to hide their phones while studying, although switching off notifications is still sensible.",
      "Christodoulou and Roussos (2025) found that the presence of a phone did not significantly distract young adults in an attention task.",
      "Therefore, a silent phone nearby may not affect concentration as much as many people assume.",
      "However, this study measured attention in a laboratory, not during real studying with messages arriving.",
      "It follows that the real problem is likely to be notifications rather than the phone itself.",
    ],
    strengths: [
      [1, { row: "sources", focusId: "reporting-verbs", label: "Reporting verbs", comment: "‘Found that’ reports the result at the right strength." }],
      [4, { row: "organisation", focusId: "concluding", label: "Ending with the ‘so what’", comment: "You turn the finding into practical advice." }],
    ],
    topic: {
      said: "Phones are a big topic for students today.",
      try: "Students do not necessarily need to hide their phones while studying, although switching off notifications is still sensible.",
      clue: "This doesn’t answer the question. Should students hide their phones?",
      pattern: "Students do not necessarily need a quiet library to revise well, although a regular place helps.",
      comment: "Your view should be clear by the end of the first sentence.",
    },
    hedge: {
      idx: 2,
      said: "Therefore, phones never affect concentration.",
      try: "Therefore, a silent phone nearby may not affect concentration as much as many people assume.",
      clue: "‘Never’ goes far beyond one laboratory study.",
      pattern: "Therefore, background music may not harm reading as much as many people assume.",
      comment: "The study tested one situation. Qualify the claim so it matches the evidence.",
    },
    extra: {
      idx: 3,
      row: "accuracy",
      focusId: "sentence-boundaries",
      label: "Sentence boundaries",
      said: "However, this study measured attention in a laboratory, it did not look at real studying with messages arriving.",
      try: "However, this study measured attention in a laboratory, not during real studying with messages arriving.",
      clue: "Two complete sentences are joined with only a comma.",
      pattern: "However, the survey was small; it did not include part-time students.",
      comment: "A comma can’t join two main clauses. Use a semicolon, a full stop, or reduce the second clause.",
    },
    model:
      "Keeping a phone out of sight may matter less than switching off its notifications. Christodoulou and Roussos (2025) report that the mere presence of a phone did not significantly reduce attentional control among 18–25-year-olds, contrary to earlier research. However, their participants completed a short laboratory task, so the finding may not apply to long study sessions in which messages keep arriving. A sensible compromise is therefore to silence the phone rather than to treat its presence as the problem.",
  },
];

const MOVE_NOTE: Record<MoveId, string> = {
  claim: "States your main point.",
  define: "Defines a key term.",
  context: "Gives the reader background.",
  summarise: "Sums up the source’s point.",
  explain: "Explains how or why.",
  example: "Gives a concrete case.",
  evidence: "Uses the source as support.",
  data: "Reports a key figure.",
  concede: "Admits a limit to your view.",
  counter: "Answers the other view.",
  sowhat: "Says why it matters.",
  recommend: "Says what the reader should do.",
};

const REQUEST_SETS = [["view", "source"], ["linking", "grammar"], ["ending", "words"], ["citing", "register"], ["support", "sentences"], ["topic"]];
const ANSWERS: Record<string, string> = {
  view: "Your view is clear from your first sentence, and every sentence after it supports that view.",
  support: "Your support is good: you use the study, then explain what it means. One more concrete example would make it stronger.",
  topic: "Your first sentence now answers the question directly. Compare it with your earlier openings: it does far more work.",
  linking: "Your linking is accurate. ‘However’ and ‘For this reason’ show exactly how each idea connects to the last.",
  ending: "Your ending says why the point matters, not just what it was. That is exactly what a reader needs.",
  source: "You use the source as evidence, in your own words, and then say what you think it shows. Good balance.",
  citing: "The author–year citation is in the right form and in the right place.",
  words: "Your vocabulary is precise. ‘Consistently’ and ‘unavoidable’ are well chosen; ‘important’ could be more specific.",
  register: "Your register is academic throughout: no contractions, no ‘you’, and no spoken phrases.",
  grammar: "Your grammar is accurate. Watch articles with singular countable nouns (‘a deadline’).",
  sentences: "Good variety: you combine a main clause with ‘while’ and ‘because’ without losing control.",
};

const DICT: { word: string; partOfSpeech: string; definition: string; example: string; collocations: string[]; distractors: string[]; wrongWords: string[]; context: string; para: number }[] = [
  { word: "correlate", partOfSpeech: "verb", definition: "to be connected so that when one thing changes, the other tends to change too", example: "Hours of sleep correlated with exam results.", collocations: ["correlate with", "strongly correlate", "be positively correlated"], distractors: ["to cause something to happen directly", "to compare two things in a table", "to correct a mistake in data"], wrongWords: ["corroborate", "collaborate", "calculate"], context: "Overall, better quality, longer duration, and greater consistency of sleep correlated with better grades.", para: 0 },
  { word: "variance", partOfSpeech: "noun", definition: "how much a set of results differs or spreads out", example: "Age explained little of the variance in scores.", collocations: ["account for the variance", "variance in", "explained variance"], distractors: ["an average of several results", "a mistake in a calculation", "a change of plan"], wrongWords: ["variety", "variable", "deviation"], context: "Sleep measures accounted for nearly 25% of the variance in academic performance.", para: 0 },
  { word: "consistency", partOfSpeech: "noun", definition: "the quality of always behaving or happening in the same way", example: "Consistency of practice matters more than long sessions.", collocations: ["greater consistency", "consistency of", "lack of consistency"], distractors: ["the thickness of a liquid only", "a sudden improvement", "a fixed rule set by a teacher"], wrongWords: ["persistence", "constancy", "insistence"], context: "Overall, better quality, longer duration, and greater consistency of sleep correlated with better grades.", para: 0 },
  { word: "account for", partOfSpeech: "phrasal verb", definition: "to form a particular amount or part of something; to explain it", example: "Students account for most of the library’s users.", collocations: ["account for nearly", "largely account for", "account for the difference"], distractors: ["to open a bank account", "to blame someone for a mistake", "to count something twice"], wrongWords: ["count on", "make up for", "allow for"], context: "Sleep measures accounted for nearly 25% of the variance in academic performance.", para: 0 },
  { word: "collaborative", partOfSpeech: "adjective", definition: "done by two or more people working together", example: "The module uses collaborative projects.", collocations: ["collaborative learning", "collaborative work", "a collaborative approach"], distractors: ["competitive between individuals", "done online only", "required by the university"], wrongWords: ["cooperative", "corroborative", "comparative"], context: "…performed better than those who engaged solely in collaborative or individual learning.", para: 1 },
  { word: "solely", partOfSpeech: "adverb", definition: "only; not involving anything or anyone else", example: "The decision was based solely on cost.", collocations: ["solely on", "solely responsible", "rely solely on"], distractors: ["slowly and carefully", "mainly but not entirely", "in a lonely way"], wrongWords: ["mainly", "slowly", "merely"], context: "…performed better than those who engaged solely in collaborative or individual learning.", para: 1 },
  { word: "demonstrate", partOfSpeech: "verb", definition: "to show clearly that something is true, using evidence", example: "The results demonstrate a clear link.", collocations: ["demonstrate that", "clearly demonstrate", "results demonstrate"], distractors: ["to protest in public only", "to suggest something is possibly true", "to describe a method"], wrongWords: ["illustrate", "denote", "determine"], context: "In Experiment 1, the results demonstrated that the participants who prepared individually before collaboration performed better…", para: 1 },
  { word: "impair", partOfSpeech: "verb", definition: "to make something weaker or worse", example: "Lack of sleep can impair memory.", collocations: ["impair performance", "seriously impair", "impair the ability to"], distractors: ["to repair something", "to put things in pairs", "to improve slightly"], wrongWords: ["repair", "impose", "imply"], context: "…the presence of a mobile phone did not significantly distract participants or impair attentional performance.", para: 2 },
  { word: "contrary to", partOfSpeech: "preposition", definition: "different from or opposite to what was expected or said", example: "Contrary to expectations, costs fell.", collocations: ["contrary to expectations", "contrary to previous research", "contrary to popular belief"], distractors: ["in agreement with", "as a result of", "in addition to"], wrongWords: ["according to", "due to", "similar to"], context: "Contrary to previous literature, the presence of a mobile phone did not significantly distract participants…", para: 2 },
  { word: "significantly", partOfSpeech: "adverb", definition: "in a way that is large or important enough to matter (in research, unlikely to be chance)", example: "Scores rose significantly after the course.", collocations: ["significantly higher", "did not significantly", "significantly affect"], distractors: ["slightly and slowly", "in a meaningful symbolic way", "by coincidence"], wrongWords: ["signally", "considerably", "sufficiently"], context: "…the presence of a mobile phone did not significantly distract participants or impair attentional performance.", para: 2 },
];

/** Replays a review history along the spaced schedule. Returns reviews before today, the step reached and the next due date. */
function replay(start: string, results: boolean[], today: string, dict = false) {
  let step = 0;
  let cur = start;
  const reviews: { date: string; ok: boolean; gap: number }[] = [];
  for (const ok of results) {
    const gap = dict && reviews.length && !reviews[reviews.length - 1].ok ? 1 : REVIEW_INTERVALS[Math.min(step, REVIEW_INTERVALS.length - 1)];
    const date = addDays(cur, gap);
    if (date >= today) break;
    reviews.push({ date, ok, gap });
    step = ok ? step + 1 : dict ? Math.max(0, step - 1) : 0;
    cur = date;
  }
  const lastFailed = dict && reviews.length > 0 && !reviews[reviews.length - 1].ok;
  const due = step >= REVIEW_INTERVALS.length ? (dict ? "9999-12-31" : undefined) : addDays(cur, lastFailed ? 1 : REVIEW_INTERVALS[step]);
  return { reviews, step, due };
}

export function loadSampleHistory() {
  const today = dayKey();
  const profile = getState().profile;
  if (!profile) return;
  const days = Array.from({ length: 23 }, (_, i) => addDays(today, i - 23)).filter((d) => d !== addDays(today, -5));
  const bank: BankItem[] = [];

  const sessions: Session[] = days.map((date, i) => {
    const p = PARAS[i % PARAS.length];
    const prompt = WARMUPS[i % WARMUPS.length];
    const topicPhase = i < 6;
    const hedgingGood = i >= days.length - 2;
    const focusId = topicPhase ? "topic-sentence" : "hedging";

    // Build the paragraph: weak opener while learning topic sentences, overclaim until hedging is secure.
    const texts = [...p.sentences];
    if (topicPhase) texts[0] = p.topic.said;
    if (!hedgingGood) texts[p.hedge.idx] = p.hedge.said;
    else texts[p.extra.idx] = p.extra.said;
    const text = texts.join(" ");

    let workIdx: number;
    let workOn: WorkOn;
    if (topicPhase) {
      workIdx = 0;
      workOn = { row: "organisation", focusId: "topic-sentence", label: "Topic sentences", ...p.topic };
    } else if (!hedgingGood) {
      workIdx = p.hedge.idx;
      const { idx: _i, ...r } = p.hedge;
      workOn = { row: "argument", focusId: "hedging", label: "Hedging claims", ...r };
    } else {
      workIdx = p.extra.idx;
      const { idx: _i, ...r } = p.extra;
      workOn = r;
    }

    const strengthPairs: [number, Strength][] = hedgingGood
      ? [
          [p.hedge.idx, { row: "argument", focusId: "hedging", label: "Hedging claims", quote: texts[p.hedge.idx], comment: "You qualified this claim to match what one study can show." }],
          [texts.length - 1, { ...p.strengths[p.strengths.length - 1][1], quote: texts[texts.length - 1] }],
        ]
      : p.strengths.filter(([k]) => k !== workIdx).map(([k, s]) => [k, { ...s, quote: texts[k] }]);
    const strengthAt = new Map(strengthPairs);

    const sentences: SentenceNote[] = texts.map((t, k) => ({
      text: t,
      move: p.moves[k],
      kind: k === workIdx ? "work" : strengthAt.has(k) ? "strength" : "none",
      note: k === workIdx ? workOn.comment : strengthAt.get(k)?.comment ?? MOVE_NOTE[p.moves[k]],
    }));

    const rowEvidence = Object.fromEntries(ROW_IDS.map((r) => [r, EV[r][i] as Evidence])) as Record<RowId, Evidence>;
    const focusEvidence: Feedback["focusEvidence"] = topicPhase
      ? [{ focusId: "topic-sentence", result: TOPIC[i] as "S" | "G" }]
      : [{ focusId: "hedging", result: hedgingGood ? "S" : "G" }, { focusId: "topic-sentence", result: "S" }];
    if (i % 3 === 0) focusEvidence.push({ focusId: "citing", result: i < 9 ? "G" : "S" });
    if (i % 3 !== 1 && i % 5 === 2) focusEvidence.push({ focusId: "conceding", result: "S" });

    const requests = REQUEST_SETS[i % REQUEST_SETS.length];
    const outline: OutlineStep[] = p.moves
      .filter((m) => !(i % 4 === 0 && m === "concede"))
      .map((m, k) => ({ move: m, note: k === 0 ? (["sleep vs study", "both, in order", "notifications"][i % 3]) : "" }));
    const isHunt = i === 14 || i === 19;
    const id = newId();

    const feedback: Feedback = {
      summary: hedgingGood
        ? "A confident, well-qualified paragraph: your claims now match your evidence."
        : topicPhase
          ? "A good paragraph with clear support. The opening needs to answer the question."
          : "Clear and well organised. One claim goes further than the evidence allows.",
      strengths: strengthPairs.map(([, s]) => s),
      workOn,
      rowEvidence,
      focusEvidence,
      focusUsedCount: hedgingGood ? 2 : 0,
      focusPhrasesUsed: hedgingGood ? ["may", "suggests"] : [],
      focusQuote: hedgingGood ? texts[p.hedge.idx] : topicPhase && TOPIC[i] === "S" ? p.topic.try : "",
      nextFocusSuggestion: "citing",
      hunt: isHunt
        ? FALLBACK_HUNT.map((h, k) => ({ item: h.phrase, verdict: k === 4 ? "missed" : k === 2 ? "close" : "natural", quote: k === 4 ? "" : h.example, note: k === 2 ? "Use ‘Admittedly’ to concede before a ‘However’." : "Used naturally." }))
        : [],
      transfer: i === days.length - 1 ? [{ label: "Topic sentences", quote: texts[0] }] : [],
      sentences,
      requestAnswers: requests.map((r) => ({ request: r, answer: ANSWERS[r] })),
      modelParagraph: p.model,
    };

    const banked = i === 2 || i === 9 || i === 16;
    if (banked) {
      const plan = i === 2 ? [true, true, true] : i === 9 ? [true, false, true, true] : [true];
      const r = replay(date, plan, today);
      bank.push({ id: newId(), date, sessionId: id, row: workOn.row, focusId: workOn.focusId, label: workOn.label, before: workOn.said, after: workOn.try, reused: i === 2 ? 1 : 0, step: r.step, due: r.due, reviews: r.reviews });
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
      frame: prompt.frame,
      source: prompt.source,
      warmup: i < 2,
      focusId,
      plan: { claim: "", support: "", soWhat: "" },
      outline,
      requests,
      requestNote: i % 6 === 3 ? "Is my citation in the right place?" : undefined,
      unsure: i % 3 === 1 ? workIdx : i % 5 === 0 ? 1 : undefined,
      text,
      words: wordCount(text),
      writeSeconds: 240 + ((i * 17) % 90),
      deletions: 12 + (i % 9),
      pasteBlocked: 0,
      huntItems: isHunt ? FALLBACK_HUNT : undefined,
      hintsUsed: isHunt ? [1] : undefined,
      feedback,
      rewrites: banked ? [{ text: workOn.try, ok: true, comment: "That works: the claim is now clear and accurate.", hintLevel: 1 }] : undefined,
      banked,
      sample: true,
    };
  });

  const QUIZ: QuizType[] = ["meaning", "gap", "recall", "use"];
  const dictionary: DictEntry[] = DICT.map((d, k) => {
    const added = days[Math.min(days.length - 1, 1 + k * 2)];
    const results = [true, k % 3 !== 1, true, k % 4 !== 2, true].slice(0, 2 + (k % 4));
    const r = replay(added, results, today, true);
    const src = WARMUPS[d.para].source!;
    return {
      id: `sample-dict-${k}`,
      word: d.word,
      partOfSpeech: d.partOfSpeech,
      definition: d.definition,
      example: d.example,
      collocations: d.collocations,
      distractors: d.distractors,
      wrongWords: d.wrongWords,
      context: d.context,
      from: src.cite,
      added,
      step: r.step,
      due: r.due ?? "9999-12-31",
      reviews: r.reviews.map((x, n) => ({ date: x.date, ok: x.ok, type: QUIZ[(n + k) % QUIZ.length] })),
    };
  });

  const ids = new Set(sessions.map((s) => s.id));
  update((s) => ({
    ...s,
    sessions: [...s.sessions.filter((x) => !x.sample), ...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
    bank: [...s.bank.filter((b) => !ids.has(b.sessionId)), ...bank].sort((a, b) => a.date.localeCompare(b.date)),
    dictionary: [...(s.dictionary ?? []).filter((e) => !e.id.startsWith("sample-dict-")), ...dictionary],
    customPrompts: s.customPrompts ?? [],
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
      dictionary: (s.dictionary ?? []).filter((e) => !e.id.startsWith("sample-dict-")),
      profile: s.profile ? { ...s.profile, frozenDates: s.profile.frozenDates.filter((d) => d !== addDays(today, -5)) } : s.profile,
    };
  });
}
