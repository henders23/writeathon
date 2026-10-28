import { SURGERY_CHECK_INSTRUCTIONS, REWRITE_SCHEMA } from "@/lib/instructions";
import { guard, jsonError, structured } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;

  const b = (await req.json().catch(() => ({}))) as { sentences?: string[]; technique?: string; model?: string; attempt?: string };
  const attempt = (b.attempt ?? "").trim().slice(0, 800);
  if (!attempt || !b.sentences?.length) return jsonError("Write your combined sentence first.", 400);

  try {
    const verdict = await structured<{ ok: boolean; comment: string }>({
      instructions: SURGERY_CHECK_INSTRUCTIONS,
      input: `SHORT SENTENCES:\n${b.sentences.map((s) => `- ${s}`).join("\n")}\nSUGGESTED TECHNIQUE: ${b.technique ?? ""}\nA MODEL ANSWER: ${b.model ?? ""}\nSTUDENT'S SENTENCE: ${attempt}`,
      schemaName: "surgery_check",
      fast: true,
      schema: REWRITE_SCHEMA,
    });
    return Response.json(verdict);
  } catch (e) {
    console.error("surgery check failed", e);
    return jsonError("Couldn't check that just now. Please try again.", 502);
  }
}
