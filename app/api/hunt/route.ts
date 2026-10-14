import type { Source } from "@/lib/bank/types";
import { FOCUS_BY_ID, type HuntItem } from "@/lib/content";
import { HUNT_INSTRUCTIONS, HUNT_SCHEMA } from "@/lib/instructions";
import { guard, jsonError, structured } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const b = (await req.json().catch(() => ({}))) as { promptText?: string; source?: Source; focusId?: string };
  const focus = b.focusId ? FOCUS_BY_ID[b.focusId] : undefined;
  if (!b.promptText || !focus) return jsonError("Missing prompt or focus.", 400);

  try {
    const out = await structured<{ items: HuntItem[] }>({
      instructions: HUNT_INSTRUCTIONS,
      input: `PROMPT: ${b.promptText}\n${b.source ? `SOURCE (${b.source.author}, ${b.source.year}): ${b.source.text}` : "SOURCE: none"}\nSTUDENT'S CURRENT FOCUS: ${focus.label} (${focus.row}). ${focus.rubric}`,
      schemaName: "phrase_hunt",
      schema: HUNT_SCHEMA,
    });
    const items = out.items.filter((i) => i.phrase?.trim()).slice(0, 5);
    if (items.length < 5) throw new Error("Too few items");
    return Response.json({ items });
  } catch (e) {
    console.error("hunt failed", e);
    return jsonError("Couldn't create today's Phrase Hunt.", 502);
  }
}
