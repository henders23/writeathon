import { FOCUSES, ROWS, ROW_IDS } from "./content";

/* ---------- Feedback on today's paragraph ---------- */

export const FEEDBACK_INSTRUCTIONS = `You are an expert EAP (English for Academic Purposes) tutor giving feedback on ONE academic paragraph that a university student wrote in about five minutes as daily practice. Their English may be anywhere from B1 to C1. The paragraph is a timed first draft, so judge it as one: notice what is working, and choose the single most useful thing to improve.

PRINCIPLES
- Focused, not comprehensive: one thing to work on, preferably today's focus if there is a clear gap there. Do not list every error.
- Never rewrite the whole paragraph. The student will revise one sentence themselves.
- Be specific, kind and honest. Write in plain British English a B1 student can follow. One or two short sentences per comment.
- Every quote you give MUST be copied exactly, character for character, from the student's paragraph (the app highlights it), and should be a whole sentence or a clear clause.
- If the paragraph uses the source, check paraphrasing: an unmarked copied string of four or more words from the source is a gap in Sources. Practice sources are attributed to fictional authors; that is expected, so cite them normally.
- Ignore spelling slips that do not affect meaning, unless they are systematic.

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
- transfer: for each RECENTLY BANKED pattern (if any are given) that the student used again correctly in today's paragraph, unprompted, give its label exactly as given and the exact quote. This is evidence of real learning, so only include clear, correct reuse. Otherwise an empty list.`;

const evidence = { type: "string", enum: ["S", "G", "N"] };
const row = { type: "string", enum: [...ROW_IDS] };
const focusId = { type: "string", enum: FOCUSES.map((f) => f.id) };
const str = { type: "string" };

export const FEEDBACK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "strengths", "workOn", "rowEvidence", "focusEvidence", "focusUsedCount", "focusPhrasesUsed", "focusQuote", "nextFocusSuggestion", "hunt", "transfer"],
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
