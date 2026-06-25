import { z } from "zod";

/**
 * Canonical schema for AI review analysis output.
 * Every provider (mock/openai/anthropic) must return data that validates here.
 * Validation happens at the boundary so the rest of the app trusts the shape.
 */
export const reviewAnalysisSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  severity: z.enum(["low", "medium", "high"]),
  should_escalate: z.boolean(),
  suggested_reply: z.string().min(1),
  reply_tone: z.enum(["professional", "warm", "friendly", "premium", "casual"]),
  key_points: z.array(z.string()).default([]),
  apology_needed: z.boolean(),
  avoid_phrases: z.array(z.string()).default([]),
  testimonial_candidate: z.boolean(),
  social_post_draft: z.string().default(""),
  confidence: z.number().min(0).max(1),
});

export type ReviewAnalysis = z.infer<typeof reviewAnalysisSchema>;

/**
 * Input passed to the AI provider for analysis. Kept intentionally small and
 * free of private customer PII beyond what is needed to draft a reply.
 */
export const reviewAnalysisInputSchema = z.object({
  platform: z.string().min(1),
  rating: z.number().int().min(1).max(5).nullable(),
  reviewer_name: z.string().optional().default(""),
  // The reviews.review_text column is nullable and analyzeAndPersist may be
  // re-run on existing rows, so accept empty text here (entry forms still
  // enforce a minimum length at capture time) rather than throwing.
  review_text: z.string().default(""),
  business_name: z.string().min(1),
  brand_tone: z
    .enum(["professional", "warm", "friendly", "premium", "casual"])
    .default("professional"),
  business_type: z.string().optional().default("service business"),
});

export type ReviewAnalysisInput = z.infer<typeof reviewAnalysisInputSchema>;
