// Rough, fast detection of target phrases while the student types, so the screen can
// react during writing. The AI makes the real judgement afterwards.

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordMatches(target: string, word: string): boolean {
  if (target.length <= 3) return word === target;
  // Allow simple inflections: suggest → suggests / suggested / suggesting.
  const stem = target.length > 5 ? target.slice(0, target.length - 1) : target;
  return word.startsWith(stem) && word.length - target.length <= 3;
}

export function findPhrase(text: string, phrase: string): boolean {
  const t = normalise(text).split(" ").filter(Boolean);
  const p = normalise(phrase.replace(/…|\.\.\./g, " ")).split(" ").filter(Boolean);
  if (p.length === 0) return false;
  for (let i = 0; i + p.length <= t.length; i++) {
    let ok = true;
    for (let j = 0; j < p.length; j++) {
      if (!wordMatches(p[j], t[i + j])) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

export function wordCount(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

/** Longest run of words copied verbatim from the source (to warn about patchwriting). */
export function longestCopiedRun(text: string, source: string): string {
  const t = normalise(text).split(" ").filter(Boolean);
  const src = ` ${normalise(source)} `;
  let best = "";
  for (let i = 0; i < t.length; i++) {
    for (let j = i + best.split(" ").length; j <= t.length; j++) {
      const run = t.slice(i, j).join(" ");
      if (src.includes(` ${run} `)) {
        if (j - i > (best ? best.split(" ").length : 0)) best = run;
      } else break;
    }
  }
  return best;
}

const ABBREV = /(?:\bet al|\be\.g|\bi\.e|\betc|\bcf|\bvs|\bDr|\bProf|\bMr|\bMrs|\bMs|\bNo|\bFig|\bp|\bpp|\bc|\b[A-Z])\.$/;

/** Split a paragraph into sentences (keeps the punctuation; copes with "et al." and initials). */
export function splitSentences(text: string): string[] {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return [];
  const parts = flat.split(/(?<=[.!?]["”’)]*)\s+(?=["“(]?[A-Z0-9])/);
  const out: string[] = [];
  for (const part of parts) {
    if (out.length && ABBREV.test(out[out.length - 1])) out[out.length - 1] += " " + part;
    else out.push(part);
  }
  return out.map((x) => x.trim()).filter(Boolean);
}

/* ---------- Checking quotes from the feedback against the paragraph ---------- */

const flatten = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").toLowerCase();

/**
 * Find a quote in the student's text and return it exactly as the student wrote it, or null if it
 * is not there. Tolerates differences in case, spacing, curly quotes and wrapping quotation marks.
 */
export function locate(text: string, quote: string): string | null {
  let q = (quote ?? "").trim();
  if (!q) return null;
  if (text.includes(q)) return q;
  const flat = text.replace(/\s+/g, " ");
  // Same length as `flat`, so indexes line up.
  const hay = flatten(flat);
  for (let pass = 0; pass < 2; pass++) {
    const needle = flatten(q);
    const at = needle.length >= 2 ? hay.indexOf(needle) : -1;
    if (at >= 0) return flat.slice(at, at + needle.length);
    q = q.replace(/^["“”'‘’…. ]+|["“”'‘’… ]+$/g, "");
  }
  return null;
}

/** The sentence of the paragraph that shares most words with a quote that could not be found exactly. */
export function closestSentence(text: string, quote: string): string | null {
  const words = new Set(normalise(quote).split(" ").filter(Boolean));
  if (words.size < 3) return null;
  let best: string | null = null;
  let bestScore = 0;
  for (const sent of splitSentences(text)) {
    const w = normalise(sent).split(" ").filter(Boolean);
    if (!w.length) continue;
    const shared = w.filter((x) => words.has(x)).length;
    const score = (2 * shared) / (w.length + words.size);
    if (score > bestScore) {
      bestScore = score;
      best = sent;
    }
  }
  return bestScore >= 0.6 ? best : null;
}
