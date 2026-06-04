/**
 * Minimal Anthropic Messages client for the Cloudflare Worker runtime (raw fetch —
 * no Node SDK). Uses structured outputs (output_config.format) to force schema-valid
 * JSON, adaptive thinking, and prompt caching on the system blocks.
 */
export interface SystemBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}

export interface ClaudeRequest {
  apiKey: string;
  system: SystemBlock[];
  userText: string;
  schema: object;
  model?: string;
  maxTokens?: number;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
}

export interface ClaudeResult<T> {
  data: T;
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number };
}

export async function generateStructured<T>(req: ClaudeRequest): Promise<ClaudeResult<T>> {
  const body = {
    model: req.model ?? "claude-opus-4-8",
    max_tokens: req.maxTokens ?? 16000,
    thinking: { type: "adaptive" },
    // Stream so long generations (full article + transcript + thinking) keep the connection
    // active and finish inside the Worker's waitUntil budget instead of being killed mid-flight
    // (which left drafts stuck on aiStatus "generating" with an empty body).
    stream: true,
    output_config: {
      effort: req.effort ?? "high",
      format: { type: "json_schema", schema: req.schema },
    },
    system: req.system,
    messages: [{ role: "user", content: req.userText }],
  };

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": req.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(`Anthropic request failed: ${(e as Error).message}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 400)}`);
  }
  if (!res.body) throw new Error("No response stream from the model.");

  // Consume the SSE stream fully (reading it to completion keeps the connection alive so a long
  // generation finishes inside the Worker budget), then parse it.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    raw += decoder.decode(value, { stream: true });
  }
  raw += decoder.decode();

  const { jsonText, stopReason, usage } = parseClaudeSse(raw);
  if (stopReason === "refusal") throw new Error("The model declined to generate this content.");
  if (!jsonText.trim()) throw new Error("No content returned from the model.");

  let data: T;
  try {
    data = JSON.parse(jsonText) as T;
  } catch {
    throw new Error("Model returned malformed JSON.");
  }
  return { data, usage };
}

/**
 * Parse an Anthropic Messages SSE stream into the accumulated answer text (the JSON for a
 * structured-output request), the final stop_reason, and token usage. Pure + unit-testable.
 */
export function parseClaudeSse(raw: string): {
  jsonText: string;
  stopReason?: string;
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number };
} {
  let jsonText = "";
  let stopReason: string | undefined;
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  for (const event of raw.split("\n\n")) {
    const dataLine = event.split("\n").find((l) => l.startsWith("data:"));
    if (!dataLine) continue;
    const payload = dataLine.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    let ev: any;
    try {
      ev = JSON.parse(payload);
    } catch {
      continue;
    }
    if (ev.type === "content_block_delta") {
      const d = ev.delta;
      if (d?.type === "text_delta" && typeof d.text === "string") jsonText += d.text;
      else if (d?.type === "input_json_delta" && typeof d.partial_json === "string") jsonText += d.partial_json;
    } else if (ev.type === "message_start") {
      const mu = ev.message?.usage ?? {};
      usage.input = mu.input_tokens ?? 0;
      usage.cacheRead = mu.cache_read_input_tokens ?? 0;
      usage.cacheWrite = mu.cache_creation_input_tokens ?? 0;
    } else if (ev.type === "message_delta") {
      if (ev.delta?.stop_reason) stopReason = ev.delta.stop_reason;
      if (ev.usage?.output_tokens != null) usage.output = ev.usage.output_tokens;
    } else if (ev.type === "error") {
      throw new Error(`Anthropic stream error: ${ev.error?.message ?? "unknown"}`);
    }
  }
  return { jsonText, stopReason, usage };
}
