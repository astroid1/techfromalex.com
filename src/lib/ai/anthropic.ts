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

  const json = (await res.json()) as {
    content?: { type: string; text?: string }[];
    usage?: Record<string, number>;
    stop_reason?: string;
  };

  if (json.stop_reason === "refusal") {
    throw new Error("The model declined to generate this content.");
  }

  const textBlock = (json.content ?? []).find((b) => b.type === "text" && b.text);
  if (!textBlock?.text) throw new Error("No content returned from the model.");

  let data: T;
  try {
    data = JSON.parse(textBlock.text) as T;
  } catch {
    throw new Error("Model returned malformed JSON.");
  }

  const u = json.usage ?? {};
  return {
    data,
    usage: {
      input: u.input_tokens ?? 0,
      output: u.output_tokens ?? 0,
      cacheRead: u.cache_read_input_tokens ?? 0,
      cacheWrite: u.cache_creation_input_tokens ?? 0,
    },
  };
}
