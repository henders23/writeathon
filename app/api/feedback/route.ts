import type { Source, TaskId } from "@/lib/bank/types";
import { FOCUS_BY_ID, ROW_IDS, TASKS, type HuntItem } from "@/lib/content";
import { FEEDBACK_INSTRUCTIONS, FEEDBACK_SCHEMA } from "@/lib/instructions";
import { guard, jsonError, structured } from "@/lib/server";
import type { Feedback, Plan } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  task?: TaskId;
  promptText?: string;
  source?: Source;
  focusId?: string;
  mode?: "write" | "hunt";
  plan?: Plan;
  text?: string;
  words?: number;
  writeSeconds?: number;
  huntItems?: HuntItem[];
  bank?: { label: string; example: string }[];
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
  const input = [
    `MODE: ${hunt.length ? "Phrase Hunt" : "Normal"}`,
    task ? `TASK TYPE: ${task.label}. A paragraph like this usually: ${task.moves.join("; ")}.` : "",
    `PROMPT: ${b.promptText}`,
    b.source ? `SOURCE (${b.source.author}, ${b.source.year}; practice source): ${b.source.text}` : "SOURCE: none today",
    `TODAY'S FOCUS: ${focus.id} (${focus.label}, area: ${focus.row})`,
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
    });
    // Normalise defensively so the app can rely on the shape.
    for (const r of ROW_IDS) if (!fb.rowEvidence?.[r]) fb.rowEvidence = { ...fb.rowEvidence, [r]: "N" };
    fb.strengths = (fb.strengths ?? []).slice(0, 2);
    fb.hunt = hunt.length ? hunt.map((h, i) => fb.hunt?.[i] ?? { item: h.phrase, verdict: "missed", quote: "", note: "" }) : [];
    const labels = new Set(bank.map((x) => x.label));
    fb.transfer = (fb.transfer ?? []).filter((t) => labels.has(t.label));
    return Response.json(fb);
  } catch (e) {
    console.error("feedback failed", e);
    return jsonError("Feedback couldn't be written just now. Your paragraph is saved, so you can try again.", 502);
  }
}
