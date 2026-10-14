import "server-only";

export const env = {
  key: () => process.env.OPENAI_API_KEY ?? "",
  accessCode: () => process.env.ACCESS_CODE ?? "",
  feedbackModel: () => process.env.OPENAI_FEEDBACK_MODEL || "gpt-6-luna",
  baseUrl: () => (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
};

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/** Returns an error Response if the request may not use the AI features, otherwise null. */
export function guard(req: Request): Response | null {
  if (!env.key()) {
    return jsonError("Feedback isn't set up yet: the server has no OpenAI API key (OPENAI_API_KEY).", 503);
  }
  const code = env.accessCode();
  if (code && req.headers.get("x-access-code")?.trim() !== code) {
    return jsonError("That access code isn't right. Check it with your tutor.", 401);
  }
  return null;
}

/** Calls the OpenAI Responses API and returns parsed structured JSON. */
export async function structured<T>(opts: {
  instructions: string;
  input: string;
  schemaName: string;
  schema: object;
}): Promise<T> {
  const res = await fetch(`${env.baseUrl()}/responses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.feedbackModel(),
      instructions: opts.instructions,
      input: opts.input,
      text: { format: { type: "json_schema", name: opts.schemaName, schema: opts.schema, strict: true } },
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenAI responses error ${res.status}: ${detail.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    output_text?: string;
    output?: { type: string; content?: { type: string; text?: string; refusal?: string }[] }[];
  };
  let text = data.output_text ?? "";
  if (!text && data.output) {
    for (const item of data.output) {
      for (const c of item.content ?? []) {
        if (c.type === "output_text" && c.text) text += c.text;
        if (c.type === "refusal") throw new Error("The model declined to respond.");
      }
    }
  }
  if (!text) throw new Error("Empty response from OpenAI.");
  return JSON.parse(text) as T;
}
