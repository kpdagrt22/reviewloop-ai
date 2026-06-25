# AI Review Workflow

## Provider abstraction
```
src/lib/ai/
  service.ts                 # getAIProvider() — selects from AI_PROVIDER, falls back to mock
  prompt.ts                  # shared SYSTEM_PROMPT + buildAnalysisPrompt()
  schemas/review-analysis.ts # Zod input + output schemas (the contract)
  providers/
    types.ts                 # AIProvider interface
    mock.ts                  # deterministic, no key required (default)
    openai.ts                # OpenAI Chat Completions via REST (no SDK)
    anthropic.ts             # Anthropic Messages via REST (no SDK)
```

Every provider implements:
```ts
interface AIProvider {
  name: string;
  model: string;
  analyzeReview(input: ReviewAnalysisInput): Promise<ReviewAnalysis>;
  summarize(prompt: string): Promise<string>;
}
```

`getAIProvider()` reads `AI_PROVIDER` (`mock` | `openai` | `anthropic`). If the
selected provider's key is missing, it logs a warning and returns the mock — the
app never hard‑fails on a missing key.

## Output schema (the contract)
`reviewAnalysisSchema` (validated at the boundary):

| Field | Type | Notes |
| --- | --- | --- |
| `sentiment` | `positive \| neutral \| negative` | |
| `severity` | `low \| medium \| high` | |
| `should_escalate` | boolean | AI's own signal |
| `suggested_reply` | string (non‑empty) | owner edits before posting |
| `reply_tone` | brand tone enum | mirrors org `brand_tone` |
| `key_points` | string[] | |
| `apology_needed` | boolean | |
| `avoid_phrases` | string[] | reminders for the owner |
| `testimonial_candidate` | boolean | true only for clearly positive reviews |
| `social_post_draft` | string | non‑empty only when testimonial_candidate |
| `confidence` | number 0..1 | |

Real providers are instructed (via `SYSTEM_PROMPT`) to return exactly this JSON.
The response is parsed and `reviewAnalysisSchema.parse()`d, so malformed output
throws and is logged rather than corrupting state.

## Orchestration: `analyzeAndPersist()`
`src/lib/reviews/analyze.ts` is the single entry point used by review capture
and "Regenerate":

1. Build & validate `ReviewAnalysisInput` (no unnecessary PII).
2. Call `provider.analyzeReview()`. On error, fall back to a safe neutral
   analysis so the UI never dead‑ends (`status = "error"` is logged).
3. **Scrub** the reply: if it matches prohibited patterns (admitting legal
   fault, incentive‑for‑edit), replace with a safe professional message.
4. Compute escalation with the **deterministic rule**
   (`shouldEscalate(rating, analysis)`) — not just the model's opinion.
5. Persist side effects:
   - update `reviews.sentiment` and `status` (`escalated` when flagged);
   - insert an `ai_reply_drafts` row in **`draft`** status (never posted);
   - insert a `notification_events` row (`negative_review`) when escalated;
   - insert an `ai_review_logs` row (provider, model, input, output, status).

## Deterministic rules (compliance‑critical)
`src/lib/reviews/rules.ts`:
- `shouldEscalate(rating, analysis)` → rating ≤ 2 **OR** AI severity high **OR**
  AI `should_escalate`.
- `isTestimonialCandidate(rating, analysis)` → rating ≥ 4 (or positive sentiment
  when rating unknown).
- `containsProhibitedReplyContent(text)` → blocks legal‑fault admissions and
  incentive‑for‑edit offers.

These hold regardless of which provider produced the analysis.

## Reply approval (owner in control)
On the review detail page the owner sees the original review, the AI analysis,
and an **editable** draft. Actions: **Copy reply**, **Save edits**, **Mark as
posted**, **Regenerate**. A disclaimer reminds them to review before posting and
never include private customer information. **Nothing is auto‑posted.**

## Weekly summary
`provider.summarize(prompt)` turns the report metrics into a short, plain‑English
recap with next actions. Works with mock (deterministic) or live providers.

## Going live
```
AI_PROVIDER=openai     OPENAI_API_KEY=sk-...
# or
AI_PROVIDER=anthropic  ANTHROPIC_API_KEY=...
```
Default models: OpenAI `gpt-4o-mini`, Anthropic `claude-haiku-4-5-20251001`
(both overridable in the provider constructors).
