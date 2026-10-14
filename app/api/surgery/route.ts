import type { SurgeryItem } from "@/lib/content";
import { SURGERY_INSTRUCTIONS, SURGERY_SCHEMA } from "@/lib/instructions";
import { guard, jsonError, structured } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const b = (await req.json().catch(() => ({}))) as { topic?: string; promptText?: string; discipline?: string };
  if (!b.topic || !b.promptText) return jsonError("Missing topic.", 400);

  try {
    const out = await structured<{ items: SurgeryItem[] }>({
      instructions: SURGERY_INSTRUCTIONS,
      input: `DISCIPLINE: ${b.discipline ?? "general"}\nTODAY'S TOPIC: ${b.topic}\nTODAY'S WRITING PROMPT (for context): ${b.promptText}`,
      schemaName: "sentence_surgery",
      schema: SURGERY_SCHEMA,
    });
    const items = out.items.filter((i) => i.sentences?.length >= 2 && i.model).slice(0, 3);
    if (items.length < 3) throw new Error("Too few items");
    return Response.json({ items });
  } catch (e) {
    console.error("surgery failed", e);
    return jsonError("Couldn't prepare today's Sentence Surgery.", 502);
  }
}
