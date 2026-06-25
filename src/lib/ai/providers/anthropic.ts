import type { AIProvider } from "@/lib/ai/providers/types";
import {
  reviewAnalysisSchema,
  type ReviewAnalysis,
  type ReviewAnalysisInput,
} from "@/lib/ai/schemas/review-analysis";
import { buildAnalysisPrompt, SYSTEM_PROMPT } from "@/lib/ai/prompt";

/**
 * Anthropic provider via the Messages REST API (no SDK dependency).
 * Activated only when AI_PROVIDER=anthropic and ANTHROPIC_API_KEY is set.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  readonly model: string;
  private readonly apiKey: string;

  constructor(apiKey: string, model = "claude-haiku-4-5-20251001") {
    this.apiKey = apiKey;
    this.model = model;
  }

  private async createMessage(system: string, user: string, maxTokens = 1024): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      throw new Error(`Anthropic request failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    const block = Array.isArray(data?.content) ? data.content[0] : null;
    return block?.text ?? "";
  }

  async analyzeReview(input: ReviewAnalysisInput): Promise<ReviewAnalysis> {
    const text = await this.createMessage(
      `${SYSTEM_PROMPT}\nRespond with ONLY a single JSON object, no prose.`,
      buildAnalysisPrompt(input),
    );
    const json = extractJson(text);
    return reviewAnalysisSchema.parse({ reply_tone: input.brand_tone, ...json });
  }

  async summarize(prompt: string): Promise<string> {
    return this.createMessage(
      "You are a concise reputation analyst for a small service business. " +
        "Summarize the metrics and give 3 practical next actions. No fluff.",
      prompt,
      512,
    );
  }
}

/** Pull the first JSON object out of a model response that may include prose. */
function extractJson(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return {};
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
}
