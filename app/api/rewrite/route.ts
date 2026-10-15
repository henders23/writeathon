import { REWRITE_INSTRUCTIONS, REWRITE_SCHEMA, TRANSFER_INSTRUCTIONS } from "@/lib/instructions";
import { guard, jsonError, structured } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = {
  mode?: "rewrite" | "review" | "transfer";
  label?: string;
  clue?: string;
  pattern?: string;
  original?: string;
  model?: string;
  attempt?: string;
  hintLevel?: number;
};

// "Rewrite it", bank reviews (fix it again from memory) and transfer sentences.
export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const b = (await req.json().catch(() => ({}))) as Body;
  const attempt = (b.attempt ?? "").trim().slice(0, 800);
  if (!attempt || !b.original) return jsonError("Write your sentence first.", 400);

  const transfer = b.mode === "transfer";
  const input = transfer
    ? `PATTERN BEING PRACTISED: ${b.label ?? ""}\nEXAMPLE OF THE PATTERN: ${b.pattern ?? ""}\nTHE STUDENT'S ORIGINAL SENTENCE (its topic): ${b.original}\nTHE MODEL THEY SAW: ${b.model ?? ""}\nSTUDENT'S NEW SENTENCE: ${attempt}`
    : `POINT BEING PRACTISED: ${b.label ?? ""}\nTHE PROBLEM: ${b.clue ?? ""}\nORIGINAL SENTENCE: ${b.original}\nA MODEL VERSION: ${b.model ?? ""}\nHINT LEVEL: ${b.hintLevel ?? 0}${
        b.mode === "review" ? "\nCONTEXT: a spaced review. The student fixed this sentence days ago and is fixing it again from memory." : ""
      }\nSTUDENT'S REWRITE: ${attempt}`;

  try {
    const verdict = await structured<{ ok: boolean; comment: string }>({
      instructions: transfer ? TRANSFER_INSTRUCTIONS : REWRITE_INSTRUCTIONS,
      input,
      schemaName: transfer ? "transfer_check" : "rewrite_check",
      schema: REWRITE_SCHEMA,
    });
    return Response.json(verdict);
  } catch (e) {
    console.error("rewrite check failed", e);
    return jsonError("Couldn't check that just now. Please try again.", 502);
  }
}
