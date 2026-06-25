import type { AIProvider } from "@/lib/ai/providers/types";
import {
  reviewAnalysisSchema,
  type ReviewAnalysis,
  type ReviewAnalysisInput,
} from "@/lib/ai/schemas/review-analysis";
import { buildAnalysisPrompt, SYSTEM_PROMPT } from "@/lib/ai/prompt";

/**
 * OpenAI provider. Implemented with the raw REST API so it has no hard package
 * dependency. Activated only when AI_PROVIDER=openai and OPENAI_API_KEY is set.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  readonly model: string;
  private readonly apiKey: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyzeReview(input: ReviewAnalysisInput): Promise<ReviewAnalysis> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildAnalysisPrompt(input) },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI request failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    // Validate against the canonical schema; throws on drift so callers can log.
    return reviewAnalysisSchema.parse({ reply_tone: input.brand_tone, ...parsed });
  }

  async summarize(prompt: string): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content:
              "You are a concise reputation analyst for a small service business. " +
              "Summarize the metrics and give 3 practical next actions. No fluff.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI request failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  }
}
