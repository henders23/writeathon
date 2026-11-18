import { parseDay } from "../dates";
import type { DisciplineId } from "../disciplines";
import { ARTS_HUMANITIES } from "./arts-humanities";
import { BUSINESS_ECONOMICS } from "./business-economics";
import { COMPUTER_SCIENCE } from "./computer-science";
import { EDUCATION } from "./education";
import { ENGINEERING } from "./engineering";
import { GENERAL } from "./general";
import { GEOGRAPHY_ENVIRONMENT } from "./geography-environment";
import { LAW } from "./law";
import { LIFE_SCIENCES } from "./life-sciences";
import { MEDICINE_HEALTH } from "./medicine-health";
import { PHYSICAL_SCIENCES } from "./physical-sciences";
import { PSYCHOLOGY } from "./psychology";
import { SOCIAL_SCIENCES } from "./social-sciences";
import type { DailyPrompt } from "./types";
import { VETERINARY } from "./veterinary";
import { WARMUPS } from "./warmups";

export const BANK: Record<DisciplineId, DailyPrompt[]> = {
  engineering: ENGINEERING,
  "computer-science": COMPUTER_SCIENCE,
  "physical-sciences": PHYSICAL_SCIENCES,
  "life-sciences": LIFE_SCIENCES,
  "medicine-health": MEDICINE_HEALTH,
  veterinary: VETERINARY,
  psychology: PSYCHOLOGY,
  "business-economics": BUSINESS_ECONOMICS,
  law: LAW,
  "social-sciences": SOCIAL_SCIENCES,
  education: EDUCATION,
  "arts-humanities": ARTS_HUMANITIES,
  "geography-environment": GEOGRAPHY_ENVIRONMENT,
  general: GENERAL,
};

export { WARMUPS };

function dayIndex(date: string) {
  return Math.floor(parseDay(date).getTime() / 86400000);
}

/** Everyone in the same discipline gets the same prompt on the same day. */
export function promptFor(discipline: string, date: string): DailyPrompt {
  const list = BANK[discipline as DisciplineId] ?? GENERAL;
  const idx = dayIndex(date);
  return list[((idx % list.length) + list.length) % list.length];
}

/**
 * Three topics to choose from today, chosen so that a student keeps meeting new questions.
 *
 * `written` maps a topic id to the date the student last wrote on it. Topics they have never
 * written on come first, and the three on offer move on each day, so a topic that was offered
 * but not chosen does not sit there day after day. When the subject's own topics run short,
 * general academic topics fill the gap. Only when everything has been written on does a topic
 * return, starting with the one written longest ago.
 */
export function choicesFor(discipline: string, date: string, written: Record<string, string> = {}): DailyPrompt[] {
  const own = BANK[discipline as DisciplineId] ?? GENERAL;
  const d = dayIndex(date);
  const fresh = (list: DailyPrompt[]) => list.filter((p) => !written[p.id]);
  /** Up to `n` of the list, starting from a point that moves on by three each day. */
  const rotate = (list: DailyPrompt[], n: number) => {
    const len = list.length;
    return Array.from({ length: Math.min(n, len) }, (_, k) => list[(((d * 3 + k) % len) + len) % len]);
  };

  const out = rotate(fresh(own), 3);
  if (out.length < 3 && own !== GENERAL) out.push(...rotate(fresh(GENERAL), 3 - out.length));
  if (out.length < 3) {
    const pool = own === GENERAL ? own : [...own, ...GENERAL];
    const oldestFirst = pool.filter((p) => written[p.id] && !out.includes(p)).sort((a, b) => written[a.id].localeCompare(written[b.id]));
    out.push(...oldestFirst.slice(0, 3 - out.length));
  }
  return out;
}

const ALL: DailyPrompt[] = [...Object.values(BANK).flat(), ...WARMUPS];
export function findPrompt(id: string): DailyPrompt | undefined {
  return ALL.find((p) => p.id === id);
}
