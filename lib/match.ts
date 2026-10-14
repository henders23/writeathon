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
