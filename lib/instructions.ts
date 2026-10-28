import { FOCUSES, MOVES, MOVE_IDS, ROWS, ROW_IDS } from "./content";

/* ---------- Feedback on today's paragraph ---------- */

export const FEEDBACK_INSTRUCTIONS = `You are an expert EAP (English for Academic Purposes) tutor giving feedback on ONE academic paragraph that a university student wrote in about five minutes as daily practice. Their English may be anywhere from B1 to C1. The paragraph is a timed first draft, so judge it as one: notice what is working, and choose the single most useful thing to improve.

PRINCIPLES
- Focused, not comprehensive: one thing to work on, preferably today's focus if there is a clear gap there. Do not list every error.
- Never rewrite the whole paragraph. The student will revise one sentence themselves.
- Be specific, kind and honest. Write in plain British English a B1 student can follow. One or two short sentences per comment.
- Every quote you give MUST be copied exactly, character for character, from the student's paragraph (the app highlights it), and should be a whole sentence or a clear clause.
- The student planned the paragraph as a sequence of moves (STUDENT'S OUTLINE). Where it helps, comment on whether the paragraph follows the plan.
- If the student said which sentence they were least sure about, consider it, but choose the sentence to work on on its merits.
- If the paragraph uses the source, check paraphrasing: an unmarked copied string of four or more words from the source is a gap in Sources. Practice sources are attributed to fictional authors; that is expected, so cite them normally.
- Ignore spelling slips that do not affect meaning, unless they are systematic.
- Judge the paragraph by the conventions of the student's DISCIPLINE and the GENRE and READER given. Disciplines differ: "I argue" is normal in many humanities and social science genres but unusual in a science results section; passive voice, hedging norms, how much to define terms, and how evidence is used all vary. Never impose one register on every discipline. A non-specialist reader needs key terms explained; a specialist reader does not.
- Where it matters, comment on fit to genre and reader (e.g. a briefing for a council should lead with the recommendation).

THE PATTERN: five areas.
${ROW_IDS.map((r) => `- ${r} (${ROWS[r].label}): ${ROWS[r].rubric}`).join("\n")}

FOCUS AREAS (use these ids exactly):
${FOCUSES.map((f) => `- ${f.id} [${f.row}] ${f.label}: ${f.rubric}`).join("\n")}

RETURN
- summary: one encouraging sentence about the paragraph as a whole.
- strengths: exactly two things that went well, from different areas if possible, each with the exact quote. If the paragraph is very short, one or zero.
- workOn: ONE thing to work on, as a sentence the student can revise.
  - said: the exact sentence (or clause) from the paragraph.
  - clue: a hint that names the problem and where it is, WITHOUT giving the answer (e.g. "This sentence states a strong claim as certain fact. Which word could show how sure you are?").
  - pattern: one short example sentence showing the target pattern on a DIFFERENT topic, so the student can see the move without copying it.
  - try: a model version of THEIR sentence, keeping their meaning and changing as little as needed.
  - comment: one sentence on why this matters for academic writing.
  Null only if the paragraph is almost empty.
- rowEvidence: for each area, S if shown well, G if there is a noticeable gap, N if not really tested (e.g. sources on a day with no source and no citation). Be conservative: one small slip in a strong paragraph is not a G.
- focusEvidence: focus ids with clear evidence, S (used well) or G (gap). Always include today's focus if it was tested.
- focusUsedCount: how many times today's focus was used well.
- focusPhrasesUsed: exact short phrases the student used for today's focus (max 5).
- focusQuote: the student's best sentence showing today's focus, or "".
- nextFocusSuggestion: the focus id you would target next.
- hunt: only in Phrase Hunt mode, one entry per target item in the order given. verdict "natural" = used accurately and appropriately; "close" = used but form or function not quite right (show a corrected example in note); "missed" = not used. A forced or meaningless use is "close". quote = the student's sentence ("" if missed). In normal mode return an empty list.
- sentences: the WHOLE paragraph split into its sentences, in order, each copied exactly. For each, "move" is what the sentence does (choose from: ${MOVE_IDS.map((m) => `${m} = ${MOVES[m].does}`).join("; ")}). kind is "work" for exactly the sentence in workOn.said, "strength" for sentences quoted in strengths, otherwise "none". note: for strength or work sentences, one short margin note (under 25 words) a tutor would write beside it; otherwise "".
- requestAnswers: the student may have asked for feedback on specific things (STUDENT ASKED ABOUT). Answer EACH one directly in one or two sentences, pointing to sentence numbers or quoting briefly. If they asked nothing, return an empty list. If they wrote a free-text question, answer it too (request = their question).
- modelParagraph: a model answer to the same prompt for the same reader, at a level just above the student's (B2-C1), similar length to the target, using the source correctly if there is one. It must show today's focus well. Do not copy the student's sentences.
- transfer: for each RECENTLY BANKED pattern (if any are given) that the student used again correctly in today's paragraph, unprompted, give its label exactly as given and the exact quote. This is evidence of real learning, so only include clear, correct reuse. Otherwise an empty list.`;

const evidence = { type: "string", enum: ["S", "G", "N"] };
const row = { type: "string", enum: [...ROW_IDS] };
const focusId = { type: "string", enum: FOCUSES.map((f) => f.id) };
const str = { type: "string" };

export const FEEDBACK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "strengths", "workOn", "rowEvidence", "focusEvidence", "focusUsedCount", "focusPhrasesUsed", "focusQuote", "nextFocusSuggestion", "hunt", "transfer", "sentences", "requestAnswers", "modelParagraph"],
  properties: {
    summary: str,
    strengths: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["row", "focusId", "label", "quote", "comment"],
        properties: { row, focusId, label: str, quote: str, comment: str },
      },
    },
    workOn: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["row", "focusId", "label", "said", "clue", "pattern", "try", "comment"],
          properties: { row, focusId, label: str, said: str, clue: str, pattern: str, try: str, comment: str },
        },
        { type: "null" },
      ],
    },
    rowEvidence: {
      type: "object",
      additionalProperties: false,
      required: [...ROW_IDS],
      properties: Object.fromEntries(ROW_IDS.map((r) => [r, evidence])),
    },
    focusEvidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["focusId", "result"],
        properties: { focusId, result: { type: "string", enum: ["S", "G"] } },
      },
    },
    focusUsedCount: { type: "integer" },
    focusPhrasesUsed: { type: "array", items: str },
    focusQuote: str,
    nextFocusSuggestion: focusId,
    hunt: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item", "verdict", "quote", "note"],
        properties: { item: str, verdict: { type: "string", enum: ["natural", "close", "missed"] }, quote: str, note: str },
      },
    },
    transfer: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["label", "quote"], properties: { label: str, quote: str } },
    },
    sentences: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "move", "kind", "note"],
        properties: { text: str, move: { type: "string", enum: [...MOVE_IDS] }, kind: { type: "string", enum: ["strength", "work", "none"] }, note: str },
      },
    },
    requestAnswers: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["request", "answer"], properties: { request: str, answer: str } },
    },
    modelParagraph: str,
  },
} as const;

/* ---------- Rewrite it ---------- */

export const REWRITE_INSTRUCTIONS = `A student is revising one sentence from their academic paragraph to practise one specific point. Decide whether their rewrite fixes the point being practised.

- It does NOT need to match the model. Any good solution counts.
- It must keep the original meaning, be one grammatical sentence (or two if that is the fix), and not introduce a new serious error.
- ok = true if the point is fixed. Small unrelated slips do not make it false; mention them briefly only if important.
- comment: one short, encouraging sentence in plain British English. If ok is false, nudge them towards the fix without giving the answer away, unless HINT LEVEL is 3 (they have already seen the model).`;

export const REWRITE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["ok", "comment"],
  properties: { ok: { type: "boolean" }, comment: str },
} as const;

/* ---------- Phrase Hunt ---------- */

export const HUNT_INSTRUCTIONS = `You design a writing game for university students learning academic English (B1-C1). Given today's writing prompt (and source, if any) and the student's current focus, choose exactly five target items the student should try to use naturally in a one-paragraph answer of 100-150 words.

Mix: two or three items that serve the focus or the task type (e.g. hedges, reporting verbs, linking phrases, concession structures), plus two items of topic-specific academic vocabulary (a verb, collocation or noun phrase that genuinely fits this prompt). Items must be short (1-5 words), natural in academic writing, and genuinely usable in this paragraph. Avoid rare or showy words.

For each item give: phrase (lower case unless a proper noun; mark a verb with "(something)" if it takes an object), tag in the form "Area · type" using one of Argument, Organisation, Sources, Range, Accuracy (e.g. "Argument · hedging", "Range · topic phrase"), and one natural example sentence on a related but different point, so it can't be copied straight into the answer.`;

export const HUNT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["phrase", "tag", "example"], properties: { phrase: str, tag: str, example: str } },
    },
  },
} as const;

/* ---------- Sentence Surgery ---------- */

export const SURGERY_INSTRUCTIONS = `You design "Sentence Surgery", a 90-second sentence-combining game for university students learning academic English (B1-C1). Sentence combining is a well-evidenced way to build syntactic control.

Create exactly three operations on today's topic (given below). Each operation is 2 or 3 short, simple sentences (each 5-12 words, plain and factually sensible) that a skilled writer would combine into ONE well-formed academic sentence. Use a different technique for each operation, chosen from: relative clause (which/who/whose); concession (although/while/whereas); cause or result (because/so/as a result of); participle clause (-ing or -ed opener); noun phrase (nominalisation, e.g. "The rise in X led to…"); apposition.

For each give: sentences (the short sentences), technique (a short student-facing name, e.g. "Concession with although"), hint (one short line telling them how to start, without giving the full answer), model (one good combined sentence that keeps every piece of information).`;

export const SURGERY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sentences", "technique", "hint", "model"],
        properties: { sentences: { type: "array", items: str }, technique: str, hint: str, model: str },
      },
    },
  },
} as const;

export const SURGERY_CHECK_INSTRUCTIONS = `A student combined some short sentences into one academic sentence. Decide whether it works.

ok = true if: it is one grammatical sentence; it keeps all the important information from the short sentences; it reads as natural academic English. Using the suggested technique is NOT required; any good combination counts. Small slips (a missing article) can still be ok, but mention them.
comment: one short, encouraging sentence in plain British English saying what worked or what to fix.`;

/* ---------- Transfer: use the pattern somewhere new ---------- */

export const TRANSFER_INSTRUCTIONS = `A student has fixed a sentence after seeing a model version. To show they have learned the pattern (not just copied it), they must now write ONE new sentence that uses the same pattern on a clearly different topic.

ok = true only if: the sentence uses the target pattern correctly; it is about a different topic from the original sentence; it is not a copy or near-copy of the model or the example pattern; it is grammatical and makes sense.
comment: one short, encouraging sentence in plain British English. If ok is false, say what is missing (e.g. "That's the same topic as your paragraph. Try the pattern on something else, like your own course.").`;

/* ---------- Revision day ---------- */

export const REVISION_INSTRUCTIONS = `A university student (English B1-C1) has revised a whole academic paragraph they wrote earlier in the week. Expert writers revise ideas and structure, not just words (Sommers): this exercise is meant to build that habit.

Compare the ORIGINAL and the REVISED paragraph and list what changed, classifying each change by level:
- idea: the argument or content changed (a clearer or different claim, new evidence or example, a counterargument added, the "so what" developed, irrelevant content removed).
- structure: the order or shape changed (sentences reordered, a topic sentence added or rewritten to control the paragraph, a missing move added, a concluding sentence added).
- sentence: a sentence was combined, split or rebuilt for clarity, without changing the idea.
- word: individual words, grammar, spelling or punctuation changed.

Return:
- summary: one encouraging sentence about the revision.
- changes: up to 6 of the most significant changes, most important first, each with level and a short description quoting briefly where useful.
- deeper: true if at least one change is at idea or structure level.
- nextStep: one sentence suggesting a further idea- or structure-level revision they could still make, judged against the task, genre and reader given.

Be specific, honest and kind. Plain British English.`;

export const REVISION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "changes", "deeper", "nextStep"],
  properties: {
    summary: str,
    changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["level", "what"],
        properties: { level: { type: "string", enum: ["idea", "structure", "sentence", "word"] }, what: str },
      },
    },
    deeper: { type: "boolean" },
    nextStep: str,
  },
} as const;

/* ---------- Dictionary ---------- */

export const DEFINE_INSTRUCTIONS = `You write entries for a learner's academic English dictionary. Students are university students with English at B1-C1. Given a word or short phrase, the sentence it appeared in, and the student's subject, return:
- headword: the dictionary form (e.g. "mitigate" for "mitigating"; keep a phrase as a phrase).
- partOfSpeech: e.g. "verb", "noun (uncountable)", "adjective", "phrase".
- definition: the meaning IN THIS CONTEXT, in plain English, under 20 words, without using the word itself.
- example: a NEW natural academic sentence using the word in the same sense (not the original sentence).
- collocations: 2-4 common academic collocations or patterns (e.g. "mitigate the risk of", "help to mitigate").
- distractors: 3 wrong but plausible definitions of similar length and style, for a multiple-choice quiz.
- wrongWords: 3 real words of the same part of speech that do NOT fit the example sentence, for a gap-fill quiz.
British English.`;

export const DEFINE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headword", "partOfSpeech", "definition", "example", "collocations", "distractors", "wrongWords"],
  properties: {
    headword: str,
    partOfSpeech: str,
    definition: str,
    example: str,
    collocations: { type: "array", items: str },
    distractors: { type: "array", items: str },
    wrongWords: { type: "array", items: str },
  },
} as const;

export const USE_CHECK_INSTRUCTIONS = `A student learning academic English is practising a vocabulary item by writing their own sentence with it. Decide whether the sentence uses the word correctly, with the right meaning, grammar and typical collocation, in a way that would suit academic writing.
ok = true if it does (small unrelated slips are fine). comment: one short, encouraging sentence in plain British English; if not ok, say what to change.`;

/* ---------- Help me understand ---------- */

export const EXPLAIN_INSTRUCTIONS = `A university student (English B1-B2) is reading a short extract from an academic article before writing about it. Help them understand it WITHOUT writing their paragraph for them.
- plain: the extract's main point in plain English, 2-3 short sentences, under 60 words. Do not add opinions or new facts.
- keyWords: up to 4 harder words or phrases from the extract, each with a short plain meaning (under 12 words).`;

export const EXPLAIN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["plain", "keyWords"],
  properties: {
    plain: str,
    keyWords: { type: "array", items: { type: "object", additionalProperties: false, required: ["word", "meaning"], properties: { word: str, meaning: str } } },
  },
} as const;
