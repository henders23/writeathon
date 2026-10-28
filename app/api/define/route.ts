import { DEFINE_INSTRUCTIONS, DEFINE_SCHEMA } from "@/lib/instructions";
import { guard, jsonError, structured } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const b = (await req.json().catch(() => ({}))) as { word?: string; context?: string; discipline?: string };
  const word = (b.word ?? "").trim().slice(0, 60);
  if (!word) return jsonError("Choose a word first.", 400);
  try {
    const out = await structured({
      instructions: DEFINE_INSTRUCTIONS,
      input: `WORD OR PHRASE: ${word}\nSENTENCE IT APPEARED IN: ${(b.context ?? "").slice(0, 600)}\nSTUDENT'S SUBJECT: ${b.discipline ?? "General academic"}`,
      schemaName: "dictionary_entry",
      schema: DEFINE_SCHEMA,
      fast: true,
    });
    return Response.json(out);
  } catch (e) {
    console.error("define failed", e);
    return jsonError("Couldn't look that word up just now.", 502);
  }
}
