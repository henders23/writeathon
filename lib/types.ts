import type { Frame, Source, TaskId } from "./bank/types";
import type { HuntItem, RowId, SurgeryItem } from "./content";

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
};

export type Plan = { claim: string; support: string; soWhat: string };

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
  source?: Source;
  focusId: string;
  plan: Plan;
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
  reviews?: { date: string; ok: boolean }[];
};

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
  huntCache: { date: string; promptId: string; focusId: string; items: HuntItem[] } | null;
  surgeryCache: { date: string; promptId: string; items: SurgeryItem[] } | null;
  surgeryRuns: SurgeryRun[];
};
