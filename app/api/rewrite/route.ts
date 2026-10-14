import { REWRITE_INSTRUCTIONS, REWRITE_SCHEMA } from "@/lib/instructions";
import { guard, jsonError, structured } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// "Rewrite it": check whether the student's revised sentence fixes the point.
export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const b = (await req.json().catch(() => ({}))) as { label?: string; clue?: string; original?: string; model?: string; attempt?: string; hintLevel?: number };
  const attempt = (b.attempt ?? "").trim().slice(0, 800);
  if (!attempt || !b.original) return jsonError("Write your new version first.", 400);

  try {
    const verdict = await structured<{ ok: boolean; comment: string }>({
      instructions: REWRITE_INSTRUCTIONS,
      input: `POINT BEING PRACTISED: ${b.label ?? ""}\nTHE PROBLEM: ${b.clue ?? ""}\nORIGINAL SENTENCE: ${b.original}\nA MODEL VERSION: ${b.model ?? ""}\nHINT LEVEL: ${b.hintLevel ?? 0}\nSTUDENT'S REWRITE: ${attempt}`,
      schemaName: "rewrite_check",
      schema: REWRITE_SCHEMA,
    });
    return Response.json(verdict);
  } catch (e) {
    console.error("rewrite check failed", e);
    return jsonError("Couldn't check that just now. Please try again.", 502);
  }
}
