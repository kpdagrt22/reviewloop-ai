"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createReviewAction, type ReviewFormState } from "../actions";

export function NewReviewForm({
  customers,
}: {
  customers: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ReviewFormState, FormData>(
    createReviewAction,
    {},
  );

  return (
    <form action={formAction} className="card">
      <div className="card-body space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Platform</label>
            <select name="platform" className="input" defaultValue="Google">
              <option>Google</option>
              <option>Facebook</option>
              <option>Yelp</option>
              <option>Trustpilot</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="label">Rating</label>
            <select name="rating" className="input" defaultValue="">
              <option value="">Unknown</option>
              <option value="5">5 — Excellent</option>
              <option value="4">4 — Good</option>
              <option value="3">3 — Okay</option>
              <option value="2">2 — Poor</option>
              <option value="1">1 — Bad</option>
            </select>
          </div>
          <div>
            <label className="label">Reviewer name</label>
            <input name="reviewerName" className="input" placeholder="e.g. Jamie L." />
          </div>
          <div>
            <label className="label">Review date</label>
            <input name="reviewDate" type="date" className="input" />
          </div>
        </div>

        <div>
          <label className="label">Review text *</label>
          <textarea
            name="reviewText"
            required
            rows={5}
            className="input"
            placeholder="Paste the exact review the customer left…"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Review URL</label>
            <input name="reviewUrl" className="input" placeholder="https://…" />
          </div>
          <div>
            <label className="label">Link to customer (optional)</label>
            <select name="customerId" className="input" defaultValue="">
              <option value="">— None —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {state.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Analyzing…" : "Save & analyze with AI"}
          </Button>
          <p className="text-xs text-gray-400">
            AI drafts a reply for you to review — nothing is posted automatically.
          </p>
        </div>
      </div>
    </form>
  );
}
