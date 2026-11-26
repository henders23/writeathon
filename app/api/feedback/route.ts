import type { Frame, Source, TaskId } from "@/lib/bank/types";
import { FOCUS_BY_ID, MOVES, REQUEST_LABEL, ROW_IDS, TASKS, type HuntItem, type MoveId } from "@/lib/content";
import { DISCIPLINE_LABEL } from "@/lib/disciplines";
import { FEEDBACK_INSTRUCTIONS, FEEDBACK_SCHEMA } from "@/lib/instructions";
import { guard, jsonError, structured } from "@/lib/server";
import { closestSentence, locate } from "@/lib/match";
import type { Feedback, OutlineStep, Plan } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  task?: TaskId;
  discipline?: string;
  frame?: Frame;
  promptText?: string;
  source?: Source;
  sources?: Source[];
  focusId?: string;
  mode?: "write" | "hunt";
  plan?: Plan;
  outline?: OutlineStep[];
  requests?: string[];
  requestNote?: string;
  unsure?: string;
  text?: string;
  words?: number;
  writeSeconds?: number;
  huntItems?: HuntItem[];
  bank?: { label: string; example: string }[];
  carry?: { strategy?: string; own?: string };
};

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const b = (await req.json().catch(() => ({}))) as Body;
  const text = (b.text ?? "").trim().slice(0, 4000);
  if (!b.promptText || !b.focusId || !FOCUS_BY_ID[b.focusId]) return jsonError("Missing prompt or focus.", 400);
  if (!text) return jsonError("There's no writing to give feedback on.", 422);

  const focus = FOCUS_BY_ID[b.focusId];
  const task = b.task && TASKS[b.task] ? TASKS[b.task] : null;
  const hunt = b.mode === "hunt" ? (b.huntItems ?? []).slice(0, 5) : [];
  const bank = (b.bank ?? []).slice(-5);
  const plan = b.plan && (b.plan.claim || b.plan.support || b.plan.soWhat) ? b.plan : null;
  const outline = (b.outline ?? []).slice(0, 8);
  const requests = (b.requests ?? []).slice(0, 2).map((r) => REQUEST_LABEL[r] ?? r);
  const note = (b.requestNote ?? "").trim().slice(0, 300);
  const carried = (b.carry?.strategy ?? "").trim().slice(0, 400);
  const carriedOwn = (b.carry?.own ?? "").trim().slice(0, 300);
  const sources = (b.sources?.length ? b.sources : b.source ? [b.source] : []).slice(0, 3);
  const srcLine = (src: Source, i: number) =>
    `SOURCE ${i + 1} (${src.cite}${src.own ? ", the student's own source" : src.journal ? `, ${src.journal}` : ""}; cite it as ${src.cite}): ${src.text.slice(0, 1500)}`;

  const input = [
    `MODE: ${hunt.length ? "Phrase Hunt" : "Normal"}`,
    `DISCIPLINE: ${DISCIPLINE_LABEL[b.discipline ?? ""] ?? "General academic"}`,
    b.frame ? `GENRE: ${b.frame.genre}. READER: ${b.frame.reader}.` : "",
    task ? `TASK TYPE: ${task.label}. A paragraph like this usually: ${task.moves.join("; ")}.` : "",
    `PROMPT: ${b.promptText}`,
    sources.length
      ? `NUMBER OF SOURCES THE STUDENT CHOSE TO USE: ${sources.length}${sources.length > 1 ? " (synthesis is assessed)" : " (synthesis is n/a)"}\n${sources.map(srcLine).join("\n")}`
      : "SOURCES: none today (sources and synthesis are n/a)",
    `TODAY'S FOCUS (a tie-breaker only): ${focus.id} (${focus.label}, area: ${focus.row})`,
    outline.length
      ? `STUDENT'S OUTLINE: ${outline.map((o, i) => `${i + 1}. ${MOVES[o.move as MoveId]?.label ?? o.move}${o.note ? ` (${o.note.slice(0, 80)})` : ""}`).join("; ")}`
      : "",
    requests.length || note
      ? `STUDENT ASKED ABOUT (answer each in requestAnswers; request = the text exactly as given here): ${[...requests, ...(note ? [`"${note}"`] : [])].join("; ")}`
      : "STUDENT ASKED ABOUT: nothing specific",
    carried
      ? `LAST TIME'S STRATEGY (from the feedback on the student's previous paragraph, to try today): ${carried}${carriedOwn ? `\nIN THE STUDENT'S OWN WORDS, THEY PLANNED TO: "${carriedOwn}"` : ""}`
      : "LAST TIME'S STRATEGY: none (followUp is null)",
    b.unsure ? `SENTENCE THE STUDENT WAS LEAST SURE ABOUT: "${b.unsure.slice(0, 400)}"` : "",
    hunt.length ? `PHRASE HUNT ITEMS (in order):\n${hunt.map((h, i) => `${i + 1}. ${h.phrase}`).join("\n")}` : "",
    bank.length ? `RECENTLY BANKED PATTERNS:\n${bank.map((x) => `- ${x.label}: "${x.example}"`).join("\n")}` : "RECENTLY BANKED PATTERNS: none",
    plan ? `STUDENT'S PLAN: claim: ${plan.claim || "-"} | support: ${plan.support || "-"} | so what: ${plan.soWhat || "-"}` : "",
    `WRITTEN IN: ${Math.round((b.writeSeconds ?? 0) / 6) / 10} minutes, ${b.words ?? 0} words`,
    "STUDENT'S PARAGRAPH:",
    text,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const fb = await structured<Feedback>({
      instructions: FEEDBACK_INSTRUCTIONS,
      input,
      schemaName: "paragraph_feedback",
      schema: FEEDBACK_SCHEMA,
      maxTokens: 5000,
    });
    // Normalise defensively so the app can rely on the shape.
    for (const r of ROW_IDS) if (!fb.rowEvidence?.[r]) fb.rowEvidence = { ...fb.rowEvidence, [r]: "N" };
    fb.hunt = hunt.length ? hunt.map((h, i) => fb.hunt?.[i] ?? { item: h.phrase, verdict: "missed", quote: "", note: "" }) : [];
    const labels = new Set(bank.map((x) => x.label));
    fb.requestAnswers = requests.length || note ? (fb.requestAnswers ?? []) : [];
    // Focus ids are free text in the schema, so keep only real ones and fall back to today's focus.
    const known = (id: unknown) => (typeof id === "string" && FOCUS_BY_ID[id.trim()] ? id.trim() : focus.id);
    fb.focusEvidence = (fb.focusEvidence ?? []).filter((e) => FOCUS_BY_ID[e.focusId?.trim()]).map((e) => ({ ...e, focusId: e.focusId.trim() }));
    fb.nextFocusSuggestion = known(fb.nextFocusSuggestion);
    fb.strengths = (fb.strengths ?? []).map((x) => ({ ...x, focusId: known(x.focusId) }));
    if (fb.workOn) fb.workOn = { ...fb.workOn, focusId: known(fb.workOn.focusId) };
    if (fb.carryForward) fb.carryForward = { ...fb.carryForward, focusId: known(fb.carryForward.focusId) };
    fb.focusPhrasesUsed = fb.focusPhrasesUsed ?? [];

    // Every quote is shown highlighted in the student's own paragraph, so it has to be there.
    // Repair small differences (quote marks, spacing) and drop anything that cannot be found.
    fb.strengths = (fb.strengths ?? [])
      .map((x) => ({ ...x, quote: locate(text, x.quote) ?? "" }))
      .filter((x) => x.quote)
      .slice(0, 2);
    if (fb.workOn) {
      const said = locate(text, fb.workOn.said) ?? closestSentence(text, fb.workOn.said);
      fb.workOn = said ? { ...fb.workOn, said } : null;
    }
    if (fb.language) {
      const quotes = (fb.language.quotes ?? []).map((q) => locate(text, q)).filter((q): q is string => Boolean(q)).slice(0, 3);
      fb.language = quotes.length ? { ...fb.language, quotes, more: Math.max(0, Math.min(9, Math.round(fb.language.more ?? 0))) } : null;
    }
    fb.transfer = (fb.transfer ?? [])
      .filter((t) => labels.has(t.label))
      .map((t) => ({ ...t, quote: locate(text, t.quote) ?? "" }))
      .filter((t) => t.quote);
    fb.focusQuote = locate(text, fb.focusQuote ?? "") ?? "";
    // The app splits the paragraph itself if the model's split does not add up to the paragraph.
    const sents = (fb.sentences ?? []).map((x) => ({ ...x, text: locate(text, x.text) ?? "" }));
    fb.sentences = sents.length && sents.every((x) => x.text) ? sents : [];
    fb.effectiveness = (fb.effectiveness ?? []).map((c) => {
      const na = (c.criterion === "synthesis" && sources.length < 2) || (c.criterion === "sources" && !sources.length);
      return { ...c, band: na ? ("n/a" as const) : c.band, quote: locate(text, c.quote ?? "") ?? "" };
    });
    if (fb.carryForward && !fb.carryForward.strategy?.trim()) fb.carryForward = undefined;
    if (!carried || !fb.followUp?.comment?.trim()) fb.followUp = null;
    return Response.json(fb);
  } catch (e) {
    console.error("feedback failed", e);
    return jsonError("Feedback couldn't be written just now. Your paragraph is saved, so you can try again.", 502);
  }
}
