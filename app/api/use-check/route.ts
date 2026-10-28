import { REWRITE_SCHEMA, USE_CHECK_INSTRUCTIONS } from "@/lib/instructions";
import { guard, jsonError, structured } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const b = (await req.json().catch(() => ({}))) as { word?: string; definition?: string; sentence?: string };
  const sentence = (b.sentence ?? "").trim().slice(0, 500);
  if (!b.word || !sentence) return jsonError("Write a sentence first.", 400);
  try {
    const out = await structured<{ ok: boolean; comment: string }>({
      instructions: USE_CHECK_INSTRUCTIONS,
      input: `WORD: ${b.word}\nMEANING: ${b.definition ?? ""}\nSTUDENT'S SENTENCE: ${sentence}`,
      schemaName: "use_check",
      schema: REWRITE_SCHEMA,
      fast: true,
    });
    return Response.json(out);
  } catch (e) {
    console.error("use check failed", e);
    return jsonError("Couldn't check that just now.", 502);
  }
}
