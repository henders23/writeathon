import { EXPLAIN_INSTRUCTIONS, EXPLAIN_SCHEMA } from "@/lib/instructions";
import { guard, jsonError, structured } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const b = (await req.json().catch(() => ({}))) as { text?: string; cite?: string };
  const text = (b.text ?? "").trim().slice(0, 2000);
  if (!text) return jsonError("Nothing to explain.", 400);
  try {
    const out = await structured({
      instructions: EXPLAIN_INSTRUCTIONS,
      input: `EXTRACT (${b.cite ?? "source"}): ${text}`,
      schemaName: "plain_explanation",
      schema: EXPLAIN_SCHEMA,
      fast: true,
    });
    return Response.json(out);
  } catch (e) {
    console.error("explain failed", e);
    return jsonError("Couldn't explain that just now.", 502);
  }
}
