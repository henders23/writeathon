// Shapes for the daily prompt bank.

export type TaskId = "respond" | "compare" | "position" | "data" | "cause" | "define" | "apply" | "counter" | "problem";

/**
 * A very short practice source (about 50 words). Written for Writeathon, attributed to
 * fictional authors so students can practise citing; data figures are illustrative.
 */
export type Source = {
  author: string; // fictional surname, e.g. "Okafor"
  year: number;
  kind: "text" | "data";
  text: string;
};

/** Who the paragraph is for and where it would sit, so the writing has a real purpose. */
export type Frame = {
  genre: string; // e.g. "Discussion section of a lab report" (BAWE-informed)
  reader: string; // e.g. "your module tutor", "a council planning committee"
};

export type DailyPrompt = {
  id: string;
  task: TaskId;
  topic: string; // 2–5 word title
  text: string; // the instruction the student sees
  frame?: Frame;
  source?: Source;
};
