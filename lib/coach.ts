// Free, in-browser coaching: outline checks before writing, and live signals while writing.
// The AI makes the real judgements afterwards; these just keep the student on track.

import type { DailyPrompt, Source } from "./bank/types";
import { FOCUS_BY_ID, MOVES, TASK_OPENERS, type MoveId } from "./content";
import { normalise, splitSentences } from "./match";

export type Check = { ok: boolean; text: string };

export function outlineChecks(prompt: DailyPrompt, ids: MoveId[], sources: Source[] = prompt.source ? [prompt.source] : []): Check[] {
  const reader = "your reader";
  const openers = TASK_OPENERS[prompt.task];
  const first = ids[0];
  const last = ids[ids.length - 1];
  const checks: Check[] = [];
  checks.push(
    first && openers.includes(first)
      ? { ok: true, text: `You open with ${MOVES[first].label.toLowerCase()}, so ${reader} knows straight away where you’re going.` }
      : { ok: false, text: `You could open with ${openers.map((m) => MOVES[m].label).join(" or ")}, so ${reader} knows your point first.` },
  );
  if (sources.length === 1) {
    const uses = ids.some((m) => m === "evidence" || m === "summarise" || m === "data");
    checks.push(
      uses
        ? { ok: true, text: `You plan to use ${sources[0].cite}.` }
        : { ok: false, text: `The task mentions ${sources[0].cite}. You might add Evidence${prompt.task === "data" ? " or Data" : " or Summarise"} to use it.` },
    );
  } else if (sources.length > 1) {
    const sourceMoves = ids.filter((m) => m === "evidence" || m === "summarise" || m === "data").length;
    const synth = ids.includes("synthesise");
    checks.push(
      synth
        ? { ok: true, text: `You plan to bring your ${sources.length} sources together with a Synthesise move.` }
        : { ok: false, text: `With ${sources.length} sources, a Synthesise move could show how they agree, differ or build on each other, rather than reporting them one by one.` },
    );
    if (sourceMoves === 0) checks.push({ ok: false, text: "Consider Evidence or Summarise, so the reader knows what the sources say." });
  }
  if (prompt.task === "counter") {
    const both = ids.includes("concede") && ids.includes("counter");
    checks.push(both ? { ok: true, text: "You concede and then counter: the heart of this task." } : { ok: false, text: "Answering a view usually works best with both Concede and Counter." });
  }
  checks.push(
    last === "sowhat" || last === "recommend"
      ? { ok: true, text: "You end by saying why it matters." }
      : { ok: false, text: `You might end with So what or Recommend, to show ${reader} why this matters.` },
  );
  const extra = Math.max(0, sources.length - 1);
  const [lo, hi] = prompt.warmup ? [3, 5 + extra] : [3, 6 + extra];
  checks.push(
    ids.length >= lo && ids.length <= hi
      ? { ok: true, text: prompt.warmup ? "A good size for a short paragraph." : "A good size for one paragraph." }
      : { ok: false, text: ids.length < lo ? `Most paragraphs like this have at least ${lo} moves.` : `That’s a lot for one paragraph; ${lo} to ${hi} moves is typical.` },
  );
  return checks;
}

/** A typical shape for the task, adjusted so it uses the source when there is one. */
export function suggestShape(prompt: DailyPrompt, shape: MoveId[], nSources = prompt.source ? 1 : 0): MoveId[] {
  const out = [...shape];
  const usesSource = out.some((m) => m === "evidence" || m === "summarise" || m === "data");
  if (prompt.source && !usesSource) {
    const ex = out.indexOf("example");
    if (ex >= 0) out[ex] = "evidence";
    else out.splice(Math.min(2, out.length - 1), 0, "evidence");
  }
  if (nSources > 1 && !out.includes("synthesise")) out.splice(Math.max(1, out.length - 1), 0, "synthesise");
  return out.slice(0, (prompt.warmup ? 5 : 6) + Math.max(0, nSources - 1));
}

/* ---------- A suggested plan, with reasons (only shown when the student asks) ---------- */

export type SuggestedMove = { move: MoveId; why: string };

/** Why this move belongs in a paragraph for this task: the reader's expectation, not just the label. */
function reasonFor(move: MoveId, i: number, prompt: DailyPrompt, sources: Source[], prev?: MoveId): string {
  const reader = prompt.frame?.reader ?? "your reader";
  const cite = sources[0]?.cite;
  const first = i === 0;
  switch (move) {
    case "claim":
      return first
        ? `The task asks a question, and ${reader} will look for your answer before anything else. Putting it first tells them how to read every sentence after it.`
        : "Now that the reader knows what the source says, they need to know where you stand on it.";
    case "define":
      return "The task turns on what a term means. The reader needs your definition before they can follow what you do with it.";
    case "context":
      return "The reader needs to know which view or situation you are answering before your answer makes sense.";
    case "summarise":
      return cite
        ? `You are responding to ${cite}, so the reader first needs to know what it says, briefly and in your own words.`
        : "The reader needs to know what you are responding to before you respond to it.";
    case "explain":
      if (prev === "data" || prev === "evidence" || prev === "summarise" || prev === "example")
        return "Figures and findings do not explain themselves. This sentence tells the reader what you think lies behind them, which is where your own thinking shows.";
      return "A claim on its own is only an opinion. This sentence gives the reason, or shows how it works, which is what makes the claim believable.";
    case "example":
      return "A concrete case lets the reader see what your point looks like in practice.";
    case "evidence":
      return cite
        ? `Academic readers expect a claim to rest on more than your word. ${cite} gives you support: report what it found and cite it.`
        : "Academic readers expect a claim to rest on more than your word, so show what supports it.";
    case "data":
      return cite
        ? `This task is about figures. Give the reader the key number from ${cite} and say what it shows, rather than listing every figure.`
        : "This task is about figures. Give the reader the key number and say what it shows.";
    case "synthesise":
      return `You chose ${sources.length} sources. Readers expect you to say how they relate (do they agree, differ, or build on each other?), not to report them one after another.`;
    case "concede":
      return "Admitting what is true in the other view shows the reader you have considered it, which makes your own position more convincing.";
    case "counter":
      return "Having conceded a point, you need to show the reader why your position still holds.";
    case "sowhat":
      return "Without this, the reader is left asking why your point matters. A last sentence that says what follows from it completes the paragraph.";
    case "recommend":
      return `The task asks what should be done, so ${reader} will expect you to end with a clear recommendation.`;
  }
}

/** A typical plan for this task and number of sources, each move with the reason it is there. */
export function suggestPlan(prompt: DailyPrompt, shape: MoveId[], sources: Source[]): SuggestedMove[] {
  return suggestShape(prompt, shape, sources.length).map((move, i, all) => ({ move, why: reasonFor(move, i, prompt, sources, all[i - 1]) }));
}

/* ---------- Live writing signals ---------- */

const HEDGES = ["may", "might", "could", "tend to", "tends to", "appears to", "appear to", "seems to", "seem to", "likely", "possibly", "perhaps", "some evidence", "to some extent", "arguably", "suggests", "usually", "often", "generally"];
const LINKS = ["however", "therefore", "as a result", "in contrast", "moreover", "furthermore", "this means", "for this reason", "consequently", "similarly", "for example", "for instance", "in addition", "although", "whereas", "while", "because", "thus"];
const REPORTING = ["argues", "argue", "suggests", "suggest", "finds", "found", "find", "shows", "show", "showed", "notes", "note", "claims", "claim", "reports", "reported", "states", "observes", "concludes", "concluded", "demonstrates", "indicates", "proposes"];
const INFORMAL = ["a lot of", "lots of", "get", "got", "thing", "things", "stuff", "really", "very", "pretty", "kind of", "sort of", "nowadays", "you", "don't", "can't", "won't", "isn't", "it's", "doesn't"];
const SOWHAT = ["this suggests", "this means", "therefore", "for this reason", "it follows", "this shows", "as a result", "consequently", "so "];

function findAll(text: string, list: string[]): string[] {
  const t = ` ${normalise(text)} `;
  return list.filter((w) => t.includes(` ${normalise(w)} `));
}

export type FocusSignal = { found: string[]; message: string; good: boolean };

export function focusSignal(focusId: string, text: string, prompt: DailyPrompt): FocusSignal {
  const sentences = splitSentences(text);
  const focus = FOCUS_BY_ID[focusId];
  if (!text.trim()) return { found: [], message: focus?.why ?? "", good: false };
  switch (focusId) {
    case "hedging": {
      const f = findAll(text, HEDGES);
      return { found: f, good: f.length > 0, message: f.length ? `You’re qualifying claims: ${f.slice(0, 4).join(", ")}.` : "No hedges yet. How sure can you be about your main claim?" };
    }
    case "linking": {
      const f = findAll(text, LINKS);
      return { found: f, good: f.length >= 2, message: f.length ? `Linking words so far: ${f.slice(0, 4).join(", ")}.` : "Show how each sentence connects to the last one." };
    }
    case "reporting-verbs":
    case "citing":
    case "paraphrasing":
    case "own-voice": {
      const cited = prompt.source ? text.includes(prompt.source.cite.split(/[\s(]/)[0]) : false;
      const f = findAll(text, REPORTING);
      return {
        found: f,
        good: cited,
        message: !prompt.source ? (focus?.why ?? "") : cited ? `You cite ${prompt.source.cite}${f.length ? ` with “${f[0]}”` : ""}.` : `Don’t forget to cite ${prompt.source.cite}.`,
      };
    }
    case "register": {
      const f = findAll(text, INFORMAL);
      return { found: f, good: f.length === 0, message: f.length ? `Sounds informal: ${f.slice(0, 4).join(", ")}.` : "Your register sounds academic so far." };
    }
    case "concluding": {
      const done = sentences.length >= 3 && findAll(sentences[sentences.length - 1], SOWHAT).length > 0;
      return { found: [], good: done, message: done ? "Your last sentence draws out why it matters." : "Finish with why your point matters." };
    }
    case "topic-sentence":
    case "clear-position": {
      const first = sentences[0] ?? "";
      return { found: [], good: first.split(/\s+/).length >= 8, message: first ? `Your first sentence: “${first.slice(0, 90)}${first.length > 90 ? "…" : ""}” Does it give your view?` : "Start with your view." };
    }
    default:
      return { found: [], good: false, message: focus?.why ?? "" };
  }
}

/** Language snapshot measures, for the progress dashboard. */
export function languageMeasures(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = splitSentences(text);
  return {
    hedgesPer100: words ? (findAll(text, HEDGES).length / words) * 100 : 0,
    avgSentence: sentences.length ? words / sentences.length : 0,
    reporting: findAll(text, REPORTING),
  };
}
