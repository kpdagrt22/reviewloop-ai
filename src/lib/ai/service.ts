import type { AIProvider } from "@/lib/ai/providers/types";
import { MockAIProvider } from "@/lib/ai/providers/mock";
import { OpenAIProvider } from "@/lib/ai/providers/openai";
import { AnthropicProvider } from "@/lib/ai/providers/anthropic";

/**
 * Provider selector. Resolves the configured AI provider from env, always
 * falling back to the mock provider so the app never hard-fails on a missing
 * key. The choice is logged-friendly via `provider.name` / `provider.model`.
 */
export function getAIProvider(): AIProvider {
  const choice = (process.env.AI_PROVIDER ?? "mock").toLowerCase();

  if (choice === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (key) return new OpenAIProvider(key);
    console.warn("[ai] AI_PROVIDER=openai but OPENAI_API_KEY missing — using mock.");
    return new MockAIProvider();
  }

  if (choice === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (key) return new AnthropicProvider(key);
    console.warn("[ai] AI_PROVIDER=anthropic but ANTHROPIC_API_KEY missing — using mock.");
    return new MockAIProvider();
  }

  return new MockAIProvider();
}

export { type AIProvider };
