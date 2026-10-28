import type { DailyPrompt, Frame, Source, TaskId } from "./bank/types";
import type { Band, CriterionId, HuntItem, MoveId, RowId, SurgeryItem } from "./content";

export type Evidence = "S" | "G" | "N"; // used well, gap noticed, not tested

export type Strength = { row: RowId; focusId: string; label: string; quote: string; comment: string };
export type WorkOn = {
  row: RowId;
  focusId: string;
  label: string;
  said: string; // the exact sentence from the paragraph
  clue: string; // hint 1: names the problem without the answer
  pattern: string; // hint 2: the pattern on a different topic
  try: string; // hint 3: a model rewrite of their sentence
  comment: string;
};
export type HuntVerdict = "natural" | "close" | "missed";
export type HuntResult = { item: string; verdict: HuntVerdict; quote: string; note: string };
export type Transfer = { label: string; quote: string };

/** One sentence of the student's paragraph, labelled with the move it performs. */
export type SentenceNote = {
  text: string;
  move: MoveId;
  kind: "strength" | "work" | "none";
  /** How well the sentence does its job (its move) for the reader. */
  effect?: "strong" | "partial" | "weak";
  note: string;
};

/** One criterion in the effectiveness profile, with an indicative CEFR level. */
export type CriterionResult = { criterion: CriterionId; band: Band; comment: string; quote: string };

export type Feedback = {
  summary: string;
  strengths: Strength[];
  workOn: WorkOn | null;
  rowEvidence: Record<RowId, Evidence>;
  focusEvidence: { focusId: string; result: "S" | "G" }[];
  focusUsedCount: number;
  focusPhrasesUsed: string[];
  focusQuote: string;
  nextFocusSuggestion: string;
  hunt: HuntResult[];
  transfer: Transfer[];
  sentences?: SentenceNote[];
  requestAnswers?: { request: string; answer: string }[];
  modelParagraph?: string;
  /** How well the paragraph works for its reader, in a sentence or two. */
  readerEffect?: string;
  /** Comment on the sequence of moves as a whole. */
  movesComment?: string;
  effectiveness?: CriterionResult[];
};

export type Plan = { claim: string; support: string; soWhat: string };
export type OutlineStep = { move: MoveId; note: string };

export type Rewrite = { text: string; ok: boolean; comment: string; hintLevel: number };

export type RevisionLevel = "idea" | "structure" | "sentence" | "word";
export type RevisionResult = {
  summary: string;
  changes: { level: RevisionLevel; what: string }[];
  deeper: boolean; // did the student revise ideas or structure, not only sentences and words?
  nextStep: string;
};

export type Session = {
  id: string;
  date: string; // local YYYY-MM-DD
  startedAt: string;
  mode: "write" | "hunt" | "revise";
  discipline: string;
  promptId: string;
  task: TaskId;
  topic: string;
  promptText: string;
  frame?: Frame;
  source?: Source; // the main source
  sources?: Source[]; // every source the student chose to draw on (1–3), main source first
  warmup?: boolean;
  focusId: string;
  plan: Plan; // legacy three-note plan
  outline?: OutlineStep[];
  requests?: string[]; // what the student asked for feedback on (request ids)
  requestNote?: string;
  unsure?: number; // index of the sentence the student was least sure of
  text: string;
  words: number;
  writeSeconds: number;
  deletions: number;
  pasteBlocked: number;
  huntItems?: HuntItem[];
  hintsUsed?: number[];
  feedback?: Feedback;
  feedbackError?: string;
  rewrites?: Rewrite[];
  banked?: boolean;
  revisionOf?: string; // revise mode: the paragraph being reworked
  revision?: RevisionResult;
  revisionError?: string;
  sample?: boolean;
};

export type BankItem = {
  id: string;
  date: string;
  sessionId: string;
  row: RowId;
  focusId: string;
  label: string;
  before: string;
  after: string;
  transfer?: string; // a new sentence using the pattern on another topic
  reused: number;
  step?: number; // position in the review schedule
  due?: string; // next review date
  reviews?: { date: string; ok: boolean; gap?: number }[];
};

export type DictEntry = {
  id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  collocations: string[];
  distractors: string[]; // wrong definitions, for quizzes
  wrongWords: string[]; // plausible wrong words, for gap-fill quizzes
  context: string; // the sentence the student found it in
  from: string; // where it was found, e.g. "Okafor et al. (2022)"
  added: string; // date
  step: number;
  due: string;
  reviews: { date: string; ok: boolean; type: QuizType }[];
};
export type QuizType = "meaning" | "gap" | "recall" | "use";

export type Profile = {
  name: string;
  discipline: string;
  group: string;
  accessCode?: string;
  createdAt: string;
  focus: { id: string; since: string };
  frozenDates: string[];
};

export type SurgeryRun = { date: string; points: number; max: number };

export type AppState = {
  version: 1;
  profile: Profile | null;
  sessions: Session[];
  bank: BankItem[];
  dictionary: DictEntry[];
  customPrompts: DailyPrompt[];
  huntCache: { date: string; promptId: string; focusId: string; items: HuntItem[] } | null;
  surgeryCache: { date: string; promptId: string; items: SurgeryItem[] } | null;
  surgeryRuns: SurgeryRun[];
};
