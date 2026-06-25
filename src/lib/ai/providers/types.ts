import type {
  ReviewAnalysis,
  ReviewAnalysisInput,
} from "@/lib/ai/schemas/review-analysis";

export interface AIProvider {
  readonly name: string;
  /** The model identifier used for logging. */
  readonly model: string;
  analyzeReview(input: ReviewAnalysisInput): Promise<ReviewAnalysis>;
  /** Free-form text generation used for weekly report summaries. */
  summarize(prompt: string): Promise<string>;
}
