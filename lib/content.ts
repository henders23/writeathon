import type { TaskId } from "./bank/types";

// The five areas of the pattern. They mirror Speakathon's five, adapted to writing:
// Range and Accuracy carry over; Fluency becomes Organisation (how a paragraph moves);
// Interaction becomes Sources (writing interacts with other writers and the reader);
// Argument keeps claim, support, stance and hedging.

export const ROW_IDS = ["argument", "organisation", "sources", "range", "accuracy"] as const;
export type RowId = (typeof ROW_IDS)[number];

export const ROWS: Record<RowId, { label: string; description: string; rubric: string }> = {
  argument: {
    label: "Argument",
    description: "A clear position, supported and qualified.",
    rubric: "A clear, specific position that answers the prompt; claims supported by reasons, examples or evidence with the link explained; claims qualified to the right degree (hedging); counterarguments acknowledged and answered.",
  },
  organisation: {
    label: "Organisation",
    description: "Topic sentences, linking and a clear end point.",
    rubric: "A topic sentence that controls the paragraph; one idea developed in a logical order; cohesion through transitions and summarising reference (this + noun); a concluding sentence that draws out significance.",
  },
  sources: {
    label: "Sources",
    description: "Paraphrasing, citing and responding to other writers.",
    rubric: "Source ideas restated in the student's own words and structure (no unmarked copied strings of four or more words); accurate author–year citation; reporting verbs that match the source's strength; the student's own voice kept distinct from the source's.",
  },
  range: {
    label: "Range",
    description: "Precise, academic vocabulary.",
    rubric: "Precise rather than vague vocabulary; appropriate academic and disciplinary words; noun phrases and nominalisation to condense ideas; formal register (no contractions, informal phrasal verbs, 'you', vague intensifiers).",
  },
  accuracy: {
    label: "Accuracy",
    description: "Control of sentences and grammar.",
    rubric: "Sentence boundaries (no comma splices, run-ons or fragments); verb tense and form, including subject–verb agreement; articles, plurals and countable/uncountable nouns. Errors that obscure meaning or are systematic matter most.",
  },
};

export type Focus = {
  id: string;
  row: RowId;
  label: string;
  why: string; // student-facing reason
  phrases: string[]; // example patterns shown before writing
  rubric: string; // what the feedback model should look for
  needsSource?: boolean; // can only be practised on days with a source
};

export const FOCUSES: Focus[] = [
  // Organisation
  { id: "topic-sentence", row: "organisation", label: "Topic sentences", why: "Your first sentence should tell the reader exactly what the paragraph will argue.", phrases: ["One major advantage of X is…", "X differs from Y in two important ways.", "The main cause of X appears to be…"], rubric: "Opens with a topic sentence that states the paragraph's controlling idea and directly answers the prompt (not a vague general opener)." },
  { id: "linking", row: "organisation", label: "Linking ideas", why: "Linking words and ‘this + noun’ show the reader how each sentence connects to the one before.", phrases: ["This approach…", "As a result,…", "In contrast,…"], rubric: "Connects sentences with accurate transitions and summarising reference (this/these + noun); avoids mechanical or wrong connectors (e.g. 'Moreover' for contrast)." },
  { id: "concluding", row: "organisation", label: "Ending with the ‘so what’", why: "A strong last sentence says why your point matters, not just what it was.", phrases: ["This suggests that…", "For this reason,…", "It follows that…"], rubric: "Ends with a concluding sentence that draws out the significance or implication and links back to the topic sentence." },
  // Argument
  { id: "clear-position", row: "argument", label: "Taking a clear position", why: "Your reader should know where you stand by the end of your first sentence.", phrases: ["On balance, X is…", "X is justified only when…", "The stronger case is for…"], rubric: "States a clear, specific position that answers the prompt, rather than describing both sides without a view." },
  { id: "supporting-claims", row: "argument", label: "Supporting claims", why: "Every claim needs a reason, an example or evidence, and a sentence that explains how it supports your point.", phrases: ["For example,…", "This is because…", "This shows that…"], rubric: "Backs claims with reasons, examples or evidence, and explains the link rather than leaving bare assertions." },
  { id: "hedging", row: "argument", label: "Hedging claims", why: "Academic writers show how certain they are. Stating every claim as a fact sounds overconfident.", phrases: ["…may / tend to / appear to…", "There is some evidence that…", "This is likely to…"], rubric: "Qualifies claims to the right degree (may, might, tends to, appears to, is likely to, to some extent), neither overclaiming nor hedging everything." },
  { id: "conceding", row: "argument", label: "Conceding and countering", why: "Admitting what is true in the other side, then answering it, makes your argument stronger.", phrases: ["Although X, Y.", "Admittedly,… However,…", "While it is true that…, …"], rubric: "Acknowledges a counterargument or limitation and responds to it within the paragraph." },
  // Sources
  { id: "paraphrasing", row: "sources", label: "Paraphrasing", why: "Putting a source into your own words and structure shows you understand it. Changing a few words isn't enough.", phrases: ["According to Lee (2021),…", "Lee (2021) suggests that…", "In other words,…"], rubric: "Restates the source in the student's own words and sentence structure; flag any copied string of four or more words without quotation marks.", needsSource: true },
  { id: "reporting-verbs", row: "sources", label: "Reporting verbs", why: "The verb you choose (argues, suggests, shows) tells your reader how strong the source's claim is.", phrases: ["Lee (2021) argues that…", "…suggests that…", "…found that…"], rubric: "Uses accurate, varied reporting verbs whose strength matches the source (argues, suggests, claims, finds, notes), with correct form and 'that' clauses.", needsSource: true },
  { id: "citing", row: "sources", label: "Citing accurately", why: "Every idea from a source needs a citation, in the right form and the right place.", phrases: ["Lee (2021) found that…", "…(Lee, 2021).", "As Lee (2021) notes,…"], rubric: "Cites source ideas with correct author–year form, integral or non-integral, placed so it is clear which ideas come from the source.", needsSource: true },
  { id: "own-voice", row: "sources", label: "Your voice and the source's", why: "Make it clear where the source ends and your own view begins.", phrases: ["However, this may not apply to…", "This finding suggests that…", "While Lee (2021) is right that…, …"], rubric: "Keeps the student's own evaluation distinct from the source's claims and responds to the source rather than only reporting it.", needsSource: true },
  // Range
  { id: "precise-words", row: "range", label: "Precise, not general, words", why: "Words like ‘things’, ‘good’ and ‘big’ hide your meaning. A precise word does more work.", phrases: ["factors / drawbacks / consequences", "a significant increase", "a key limitation"], rubric: "Chooses precise lexis over vague general words (things, stuff, good, bad, big, a lot, very)." },
  { id: "nominalisation", row: "range", label: "Noun phrases", why: "Academic writing often turns actions into nouns, which packs more meaning into each sentence.", phrases: ["the reduction in costs", "an increase in demand", "the introduction of…"], rubric: "Uses nominalisation and noun phrases appropriately to condense information, without becoming unclear." },
  { id: "register", row: "range", label: "Academic register", why: "‘A lot of’, ‘get’ and contractions sound like speech. Small swaps make your writing sound academic.", phrases: ["a large number of / considerable", "obtain / become / increase", "does not (not doesn't)"], rubric: "Keeps a formal academic register: no contractions, informal phrasal verbs, 'you', rhetorical questions or vague intensifiers." },
  // Accuracy
  { id: "sentence-boundaries", row: "accuracy", label: "Sentence boundaries", why: "Each sentence needs a complete main clause. Run-ons, comma splices and fragments are easy to fix once you spot them.", phrases: ["…; however, …", "Although X, Y.", "…, which means that…"], rubric: "Controls sentence boundaries: no comma splices, run-on sentences or fragments." },
  { id: "verb-forms", row: "accuracy", label: "Verb forms and tenses", why: "Present tense for general truths and what writers argue; past tense for what a specific study found.", phrases: ["Research suggests that…", "Lee (2021) found that…", "This has led to…"], rubric: "Controls tense, subject–verb agreement and verb form, including the present for general claims and an appropriate tense with sources." },
  { id: "articles-nouns", row: "accuracy", label: "Articles and plurals", why: "Small words carry meaning. Slips with a/the and plurals are common and fixable.", phrases: ["the results / a result", "many studies / much research", "evidence (uncountable)"], rubric: "Accurate articles, plurals and countable/uncountable nouns." },
];

export const FOCUS_BY_ID: Record<string, Focus> = Object.fromEntries(FOCUSES.map((f) => [f.id, f]));
export const FIRST_FOCUS = "topic-sentence";
/** Used in place of a Sources focus on days with no source. */
export const NO_SOURCE_STAND_IN = "supporting-claims";

/* ---------- Task types: how a paragraph like this works ---------- */

export const TASKS: Record<TaskId, { label: string; moves: string[] }> = {
  respond: { label: "Summarise and respond", moves: ["Sum up the source’s point in your own words", "Say whether you agree, partly agree or disagree", "Give a reason or example", "End with what this means"] },
  compare: { label: "Compare", moves: ["Name both and the key difference", "Explain it, point by point", "Use the evidence", "Say why the difference matters"] },
  position: { label: "Take a position", moves: ["State your position clearly", "Give your strongest reason", "Support it with an example", "Qualify it or answer the other side"] },
  data: { label: "Describe and interpret data", moves: ["Say what the data shows overall", "Give the key figures", "Suggest what might explain it", "Note a limitation or implication"] },
  cause: { label: "Explain causes or effects", moves: ["State the main cause or effect", "Explain how it happens", "Support it with the source", "Say why it matters"] },
  define: { label: "Define and illustrate", moves: ["Define it: term, category, key feature", "Say what it includes or excludes", "Give an example", "Say why the idea matters"] },
  apply: { label: "Apply a concept", moves: ["State the concept, citing the source", "Apply it to the case", "Explain what it shows", "Note a limit to the concept"] },
  counter: { label: "Answer a counterargument", moves: ["State the view fairly", "Concede what is true in it", "Answer it with a reason", "Restate your position"] },
  problem: { label: "Problem and solution", moves: ["State the problem and why it matters", "Propose a solution", "Explain how it works, using the source", "Weigh up a limitation"] },
};

/* ---------- Session shape ---------- */

export const READ_SECONDS = 60; // suggested
export const PLAN_SECONDS = 30; // suggested
export const WRITE_SECONDS = 300;
export const TARGET_WORDS = { min: 100, max: 150 };
export const MIN_WORDS_TO_COUNT = 40;

/* ---------- Games ---------- */

export type HuntItem = { phrase: string; tag: string; example: string };

export const FALLBACK_HUNT: HuntItem[] = [
  { phrase: "there is some evidence that", tag: "Argument · hedging", example: "There is some evidence that smaller classes improve attainment." },
  { phrase: "this suggests that", tag: "Organisation · so what", example: "This suggests that cost is not the only barrier." },
  { phrase: "admittedly", tag: "Argument · conceding", example: "Admittedly, the sample was small. However, the pattern is clear." },
  { phrase: "a key limitation", tag: "Range · precise words", example: "A key limitation of the study is its reliance on self-report." },
  { phrase: "in contrast", tag: "Organisation · linking", example: "In contrast, rural areas saw little change." },
];

export type SurgeryItem = { sentences: string[]; technique: string; hint: string; model: string };

export const FALLBACK_SURGERY: SurgeryItem[] = [
  {
    sentences: ["The study used a small sample.", "Its findings are still useful.", "They suggest a clear pattern."],
    technique: "Concession with although",
    hint: "Start with ‘Although’ and keep the main point in the main clause.",
    model: "Although the study used a small sample, its findings are still useful because they suggest a clear pattern.",
  },
  {
    sentences: ["Many cities have introduced cycle lanes.", "Cycle lanes reduce traffic.", "They also improve air quality."],
    technique: "Relative clause",
    hint: "Use ‘which’ to attach what cycle lanes do.",
    model: "Many cities have introduced cycle lanes, which reduce traffic and improve air quality.",
  },
  {
    sentences: ["Prices increased sharply.", "This happened in 2022.", "As a result, demand fell."],
    technique: "Noun phrase",
    hint: "Turn ‘prices increased’ into a noun phrase: ‘The sharp increase in…’.",
    model: "The sharp increase in prices in 2022 led to a fall in demand.",
  },
];
export const SURGERY_SECONDS = 90;

/* ---------- Paragraph moves (what each sentence does) ---------- */

export const MOVE_IDS = ["claim", "define", "context", "summarise", "explain", "example", "evidence", "data", "synthesise", "concede", "counter", "sowhat", "recommend"] as const;
export type MoveId = (typeof MOVE_IDS)[number];

export const MOVES: Record<MoveId, { label: string; does: string; group: "Open" | "Develop" | "Argue" | "Close" }> = {
  claim: { label: "Claim", does: "Your main point, first", group: "Open" },
  define: { label: "Define", does: "What a key term means", group: "Open" },
  context: { label: "Context", does: "Background the reader needs", group: "Open" },
  summarise: { label: "Summarise", does: "The source’s point, in your words", group: "Open" },
  explain: { label: "Explain how", does: "The mechanism or reason", group: "Develop" },
  example: { label: "Example", does: "A concrete case", group: "Develop" },
  evidence: { label: "Evidence", does: "Use the source, with citation", group: "Develop" },
  data: { label: "Data", does: "A key figure and what it shows", group: "Develop" },
  synthesise: { label: "Synthesise", does: "Show how the sources relate", group: "Argue" },
  concede: { label: "Concede", does: "Admit a limit or other view", group: "Argue" },
  counter: { label: "Counter", does: "Answer the other view", group: "Argue" },
  sowhat: { label: "So what", does: "Why it matters to the reader", group: "Close" },
  recommend: { label: "Recommend", does: "What the reader should do", group: "Close" },
};

/** A typical shape for each task, offered by "Suggest a shape". */
export const TASK_SHAPES: Record<TaskId, MoveId[]> = {
  respond: ["summarise", "claim", "explain", "sowhat"],
  compare: ["claim", "explain", "evidence", "sowhat"],
  position: ["claim", "explain", "example", "concede", "sowhat"],
  data: ["data", "explain", "evidence", "sowhat"],
  cause: ["claim", "explain", "evidence", "sowhat"],
  define: ["define", "explain", "example", "sowhat"],
  apply: ["summarise", "example", "explain", "sowhat"],
  counter: ["context", "concede", "counter", "sowhat"],
  problem: ["claim", "explain", "evidence", "recommend"],
};

/** The move a paragraph for this task usually opens with. */
export const TASK_OPENERS: Record<TaskId, MoveId[]> = {
  respond: ["summarise", "claim"],
  compare: ["claim"],
  position: ["claim"],
  data: ["data", "claim"],
  cause: ["claim"],
  define: ["define"],
  apply: ["summarise", "claim", "define"],
  counter: ["context", "claim", "concede"],
  problem: ["claim", "context"],
};

/* ---------- What students can ask feedback on ---------- */

export const REQUESTS: { id: string; label: string; row: RowId; needsSource?: boolean; needsSources?: number }[] = [
  { id: "effect", label: "Does it work for the reader?", row: "argument" },
  { id: "moves", label: "My paragraph moves", row: "organisation" },
  { id: "view", label: "My main view", row: "argument" },
  { id: "support", label: "Supporting my point", row: "argument" },
  { id: "topic", label: "My first sentence", row: "organisation" },
  { id: "linking", label: "Linking ideas", row: "organisation" },
  { id: "ending", label: "My ending", row: "organisation" },
  { id: "source", label: "Using the source", row: "sources", needsSource: true },
  { id: "citing", label: "Citing", row: "sources", needsSource: true },
  { id: "synthesis", label: "Combining the sources", row: "sources", needsSource: true, needsSources: 2 },
  { id: "words", label: "Academic words", row: "range" },
  { id: "register", label: "Sounding academic", row: "range" },
  { id: "grammar", label: "Grammar", row: "accuracy" },
  { id: "sentences", label: "Sentence structure", row: "accuracy" },
];
export const REQUEST_LABEL: Record<string, string> = Object.fromEntries(REQUESTS.map((r) => [r.id, r.label]));

export const WARMUP_WORDS = { min: 60, max: 100 };

/* ---------- How many sources ---------- */

/** Word targets and writing time grow a little with each extra source to synthesise. */
export function targetFor(warmup: boolean | undefined, sources: number) {
  const base = warmup ? WARMUP_WORDS : TARGET_WORDS;
  const extra = Math.max(0, sources - 1);
  return { min: base.min + extra * 30, max: base.max + extra * 40, seconds: WRITE_SECONDS + extra * 60 };
}

/* ---------- Effectiveness criteria (aligned to the CEFR Companion Volume, 2020) ---------- */

export const CRITERION_IDS = ["task", "moves", "coherence", "sources", "synthesis", "precision", "language"] as const;
export type CriterionId = (typeof CRITERION_IDS)[number];
export const BANDS = ["A2", "B1", "B1+", "B2", "B2+", "C1", "C2"] as const;
export type Band = (typeof BANDS)[number] | "n/a";

export const CRITERIA: Record<CriterionId, { label: string; cefr: string; asks: string; language?: boolean }> = {
  task: {
    label: "Task and argument",
    cefr: "Written production: reports and essays · Thematic development",
    asks: "Does the paragraph answer the question for its reader, with a clear point that is developed with reasons, examples or evidence?",
  },
  moves: {
    label: "Paragraph moves",
    cefr: "Thematic development",
    asks: "Does each sentence do a clear job, in an order that builds the point from opening to ‘so what’?",
  },
  coherence: {
    label: "Coherence and cohesion",
    cefr: "Coherence and cohesion",
    asks: "Do the ideas connect, so the reader can follow the line of thought without effort?",
  },
  sources: {
    label: "Using sources",
    cefr: "Mediation: processing text in writing",
    asks: "Is the source understood, put in the writer’s own words, cited, and used to support the writer’s point rather than replace it?",
  },
  synthesis: {
    label: "Synthesis",
    cefr: "Reports and essays: synthesising information and arguments from a number of sources",
    asks: "Are the sources related to each other (agreeing, contrasting, qualifying, building on) to make the writer’s own point, rather than reported one after another?",
  },
  precision: {
    label: "Precision and stance",
    cefr: "Propositional precision",
    asks: "Are claims as strong as the evidence allows, with nuance and the writer’s stance clear?",
  },
  language: {
    label: "Language for the job",
    cefr: "Vocabulary range · Grammatical accuracy",
    asks: "Do words and grammar carry the meaning clearly in an academic register? (Judged by effect on the reader, not by error count.)",
    language: true,
  },
};
