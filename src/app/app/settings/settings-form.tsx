"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { BRAND_TONES } from "@/lib/validation/schemas";
import { updateSettingsAction, type SettingsState } from "./actions";
import type { Tables } from "@/lib/supabase/types";

export function SettingsForm({ org }: { org: Tables<"organizations"> }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    updateSettingsAction,
    {},
  );

  return (
    <form action={action} className="card">
      <div className="card-body space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name">
            <input name="name" defaultValue={org.name} className="input" required />
          </Field>
          <Field label="Phone">
            <input name="phone" defaultValue={org.phone ?? ""} className="input" />
          </Field>
          <Field label="Website">
            <input name="website" defaultValue={org.website ?? ""} className="input" />
          </Field>
          <Field label="Brand tone">
            <select name="brandTone" defaultValue={org.brand_tone} className="input">
              {BRAND_TONES.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Google review link">
            <input
              name="googleReviewLink"
              defaultValue={org.google_review_link ?? ""}
              className="input"
              placeholder="https://g.page/r/...review"
            />
          </Field>
          <Field label="Facebook review link">
            <input
              name="facebookReviewLink"
              defaultValue={org.facebook_review_link ?? ""}
              className="input"
            />
          </Field>
          <Field label="Yelp / Trustpilot link">
            <input
              name="otherReviewLink"
              defaultValue={org.other_review_link ?? ""}
              className="input"
            />
          </Field>
          <Field label="Negative review escalation email">
            <input
              name="escalationEmail"
              type="email"
              defaultValue={org.escalation_email ?? ""}
              className="input"
            />
          </Field>
        </div>

        {state.error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        ) : null}
        {state.ok ? <p className="text-sm text-green-600">Settings saved.</p> : null}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}
