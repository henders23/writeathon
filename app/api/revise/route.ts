import type { Frame, TaskId } from "@/lib/bank/types";
import { TASKS } from "@/lib/content";
import { DISCIPLINE_LABEL } from "@/lib/disciplines";
import { REVISION_INSTRUCTIONS, REVISION_SCHEMA } from "@/lib/instructions";
import { guard, jsonError, structured } from "@/lib/server";
import type { RevisionResult } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = { discipline?: string; task?: TaskId; frame?: Frame; promptText?: string; original?: string; revised?: string; earlierFeedback?: string };

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const b = (await req.json().catch(() => ({}))) as Body;
  const original = (b.original ?? "").trim().slice(0, 4000);
  const revised = (b.revised ?? "").trim().slice(0, 4000);
  if (!original || !revised) return jsonError("Missing paragraph.", 400);

  const task = b.task && TASKS[b.task] ? TASKS[b.task] : null;
  const input = [
    `DISCIPLINE: ${DISCIPLINE_LABEL[b.discipline ?? ""] ?? "General academic"}`,
    b.frame ? `GENRE: ${b.frame.genre}. READER: ${b.frame.reader}.` : "",
    task ? `TASK TYPE: ${task.label}. A paragraph like this usually: ${task.moves.join("; ")}.` : "",
    `PROMPT: ${b.promptText ?? ""}`,
    b.earlierFeedback ? `EARLIER FEEDBACK ON THE ORIGINAL: ${b.earlierFeedback}` : "",
    "ORIGINAL PARAGRAPH:",
    original,
    "REVISED PARAGRAPH:",
    revised,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const out = await structured<RevisionResult>({ instructions: REVISION_INSTRUCTIONS, input, schemaName: "revision_check", schema: REVISION_SCHEMA });
    out.changes = (out.changes ?? []).slice(0, 6);
    out.deeper = out.changes.some((c) => c.level === "idea" || c.level === "structure");
    return Response.json(out);
  } catch (e) {
    console.error("revision failed", e);
    return jsonError("Couldn't compare your versions just now. Your revision is saved, so you can try again.", 502);
  }
}
