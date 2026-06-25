"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { generateSummaryAction, type SummaryState } from "./actions";

export function SummaryGenerator() {
  const [state, action, pending] = useActionState<SummaryState, FormData>(
    async () => generateSummaryAction(),
    {},
  );

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">AI summary</h2>
          <form action={action}>
            <Button type="submit" disabled={pending}>
              {pending ? "Generating…" : "Generate AI summary"}
            </Button>
          </form>
        </div>
        {state.error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        ) : null}
        {state.summary ? (
          <div className="mt-4 space-y-3">
            <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              {state.summary}
            </pre>
            <CopyButton text={state.summary} label="Copy summary" />
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            Generate a plain-English recap with recommended next actions (uses mock AI if no key
            is set).
          </p>
        )}
      </div>
    </div>
  );
}
