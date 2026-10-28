// Shapes for the topic library.

export type TaskId = "respond" | "compare" | "position" | "data" | "cause" | "define" | "apply" | "counter" | "problem";

/**
 * A short extract (about 35–60 words) quoted verbatim from a genuine open-access academic
 * article (CC BY, CC BY-SA or CC0), with full attribution.
 */
export type Source = {
  kind: "text" | "data";
  text: string; // verbatim extract
  cite: string; // in-text citation, e.g. "Okafor et al. (2022)"
  authors: string; // reference-list form, e.g. "Okafor, C., Smith, J. and Lee, K."
  year: number;
  title: string;
  journal: string;
  doi?: string; // e.g. "10.1371/journal.pone.0123456"
  url: string; // the page the extract was taken from
  license: string; // e.g. "CC BY 4.0"
  section?: "abstract" | "author summary" | "article"; // where in the article the extract comes from
  /** Set for a source the student pasted themselves. */
  own?: boolean;
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
  /**
   * Further genuine extracts on the same question (from different articles), so the student can
   * choose to draw on 2 or 3 sources and practise synthesis. Each follows the same rules as `source`.
   */
  more?: Source[];
  /** Warm-up tasks are short and accessible: the first sessions use them. */
  warmup?: boolean;
};
