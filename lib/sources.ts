import type { DailyPrompt, Source } from "./bank/types";

/** Every genuine source available for a topic: the main one first, then any extras (up to 3 in all). */
export function availableSources(prompt: DailyPrompt): Source[] {
  return prompt.source ? [prompt.source, ...(prompt.more ?? [])].slice(0, 3) : [];
}

/** The sources a student chose to draw on. */
export function chosenSources(prompt: DailyPrompt, n: number): Source[] {
  const all = availableSources(prompt);
  return all.slice(0, Math.max(1, Math.min(n, all.length)));
}

function list(xs: string[]) {
  return xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

/** The extra instruction shown when a student chooses to synthesise two or three sources. */
export function synthesisLine(sources: Source[]): string {
  if (sources.length < 2) return "";
  const extra = sources.slice(1).map((s) => s.cite);
  return `Also draw on ${list(extra)}: bring the ${sources.length} sources together to make your point, showing where they agree, differ or add to each other.`;
}

export function citesOf(sources: Source[]) {
  return list(sources.map((s) => s.cite));
}

/** Is a source cited in the text? Looks for the first author's surname. */
export function isCited(text: string, s: Source): boolean {
  const surname = s.cite.split(/\s+(?:et al\.|and)\s+|\s*\(/)[0].trim();
  return surname.length > 1 && text.toLowerCase().includes(surname.toLowerCase());
}
