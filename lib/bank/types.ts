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

export type DailyPrompt = {
  id: string;
  task: TaskId;
  topic: string; // 2–5 word title
  text: string; // the instruction the student sees
  source?: Source;
};
