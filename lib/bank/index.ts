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

/** Everyone in the same discipline gets the same prompt on the same day. */
export function promptFor(discipline: string, date: string): DailyPrompt {
  const list = BANK[discipline as DisciplineId] ?? GENERAL;
  const idx = Math.floor(parseDay(date).getTime() / 86400000);
  return list[((idx % list.length) + list.length) % list.length];
}
