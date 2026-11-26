import "server-only";

/**
 * AI provider. Writeathon can run on Claude (Anthropic) or OpenAI.
 * - If ANTHROPIC_API_KEY is set, Claude is used (unless AI_PROVIDER=openai).
 * - Otherwise OPENAI_API_KEY is used.
 */
export type Provider = "anthropic" | "openai";

export const env = {
  provider: (): Provider | null => {
    const forced = (process.env.AI_PROVIDER ?? "").toLowerCase();
    if (forced === "anthropic" || forced === "claude") return process.env.ANTHROPIC_API_KEY ? "anthropic" : null;
    if (forced === "openai") return process.env.OPENAI_API_KEY ? "openai" : null;
    if (process.env.ANTHROPIC_API_KEY) return "anthropic";
    if (process.env.OPENAI_API_KEY) return "openai";
    return null;
  },
  accessCode: () => process.env.ACCESS_CODE ?? "",
  // Claude
  anthropicKey: () => process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
  anthropicFastModel: () => process.env.ANTHROPIC_FAST_MODEL || "claude-haiku-5-5",
  anthropicBaseUrl: () => (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1").replace(/\/$/, ""),
  // OpenAI
  openaiKey: () => process.env.OPENAI_API_KEY ?? "",
  feedbackModel: () => process.env.OPENAI_FEEDBACK_MODEL || "gpt-6-luna",
  baseUrl: () => (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
};

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/** Returns an error Response if the request may not use the AI features, otherwise null. */
export function guard(req: Request): Response | null {
  if (!env.provider()) {
    return jsonError("Feedback isn't set up yet: the server needs an ANTHROPIC_API_KEY (or OPENAI_API_KEY).", 503);
  }
  const code = env.accessCode();
  if (code && req.headers.get("x-access-code")?.trim() !== code) {
    return jsonError("That access code isn't right. Check it with your tutor.", 401);
  }
  return null;
}

type StructuredOpts = {
  instructions: string;
  input: string;
  schemaName: string;
  schema: object;
  /** Short yes/no checks can use a faster, cheaper model. */
  fast?: boolean;
  maxTokens?: number;
};

/** Asks the configured model for JSON matching `schema` and returns it parsed. */
export async function structured<T>(opts: StructuredOpts): Promise<T> {
  return env.provider() === "anthropic" ? claudeStructured<T>(opts) : openaiStructured<T>(opts);
}

/* ---------- Claude (Anthropic Messages API, structured outputs) ---------- */

/** Schemas Claude could not compile into a grammar; later calls skip straight to plain JSON. */
const tooComplex = new Set<string>();

function claudeRequest(opts: StructuredOpts, constrained: boolean) {
  const system: object[] = [{ type: "text", text: opts.instructions, cache_control: { type: "ephemeral" } }];
  if (!constrained) {
    system.push({
      type: "text",
      text: `Reply with one JSON object and nothing else: no code fences, no commentary. Include every required property. It must match this JSON Schema:\n${JSON.stringify(opts.schema)}`,
    });
  }
  return fetch(`${env.anthropicBaseUrl()}/messages`, {
    method: "POST",
    headers: {
      "x-api-key": env.anthropicKey(),
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.fast ? env.anthropicFastModel() : env.anthropicModel(),
      max_tokens: opts.maxTokens ?? (opts.fast ? 600 : 3000),
      // The instructions are identical on every call, so cache them: later calls read them at a fraction of the cost.
      system,
      messages: [{ role: "user", content: opts.input }],
      ...(constrained ? { output_config: { format: { type: "json_schema", schema: opts.schema } } } : {}),
    }),
  });
}

async function claudeStructured<T>(opts: StructuredOpts): Promise<T> {
  let constrained = !tooComplex.has(opts.schemaName);
  let res = await claudeRequest(opts, constrained);
  let detail = res.ok ? "" : await res.text();
  // Claude refuses schemas whose compiled grammar is too big. Rather than fail, ask for the same JSON unconstrained.
  if (constrained && res.status === 400 && /grammar|too complex/i.test(detail)) {
    console.warn(`Schema "${opts.schemaName}" is too complex for structured outputs; using plain JSON instead.`);
    tooComplex.add(opts.schemaName);
    constrained = false;
    res = await claudeRequest(opts, false);
    detail = res.ok ? "" : await res.text();
  }
  if (!res.ok) throw new Error(`Claude API error ${res.status}: ${detail.slice(0, 400)}`);
  const data = (await res.json()) as { content?: { type: string; text?: string }[]; stop_reason?: string };
  if (data.stop_reason === "refusal") throw new Error("The model declined to respond.");
  if (data.stop_reason === "max_tokens") throw new Error("The model's answer was cut off (max_tokens).");
  let text = (data.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
  if (!text) throw new Error("Empty response from Claude.");
  if (!constrained) {
    // Without the grammar the model may still wrap the object in a fence or a sentence.
    const from = text.indexOf("{");
    const to = text.lastIndexOf("}");
    if (from < 0 || to <= from) throw new Error("Claude did not return JSON.");
    text = text.slice(from, to + 1);
  }
  return JSON.parse(text) as T;
}

/* ---------- OpenAI (Responses API) ---------- */

async function openaiStructured<T>(opts: StructuredOpts): Promise<T> {
  const res = await fetch(`${env.baseUrl()}/responses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.openaiKey()}`, "Content-Type": "application/json" },
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
