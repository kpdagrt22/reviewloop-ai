"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { BRAND_TONES, BUSINESS_TYPES } from "@/lib/validation/schemas";
import { createOrganizationAction, type OnboardingState } from "./actions";

const DEFAULT_TZ =
  typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";

export function OnboardingForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    createOrganizationAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-8">
      <Section title="Business basics" desc="Tell us about your business.">
        <Grid>
          <Field label="Business name" required>
            <input name="businessName" required className="input" placeholder="Acme Plumbing" />
          </Field>
          <Field label="Owner name" required>
            <input name="ownerName" required className="input" placeholder="Jordan Smith" />
          </Field>
          <Field label="Email" required>
            <input
              name="email"
              type="email"
              required
              defaultValue={defaultEmail}
              className="input"
              placeholder="owner@business.com"
            />
          </Field>
          <Field label="Phone">
            <input name="phone" className="input" placeholder="+1 555 123 4567" />
          </Field>
          <Field label="Website">
            <input name="website" className="input" placeholder="https://business.com" />
          </Field>
          <Field label="Business type" required>
            <select name="businessType" required className="input" defaultValue="Plumbing">
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </Grid>
      </Section>

      <Section title="Location & timezone" desc="Used for scheduling and reports.">
        <Grid>
          <Field label="Country" required>
            <input name="country" required className="input" placeholder="United States" />
          </Field>
          <Field label="State / region">
            <input name="state" className="input" placeholder="California" />
          </Field>
          <Field label="City">
            <input name="city" className="input" placeholder="San Diego" />
          </Field>
          <Field label="Timezone" required>
            <input name="timezone" required className="input" defaultValue={DEFAULT_TZ} />
          </Field>
        </Grid>
      </Section>

      <Section title="Review links" desc="Where you want customers to leave reviews.">
        <Grid>
          <Field label="Google review link">
            <input
              name="googleReviewLink"
              className="input"
              placeholder="https://g.page/r/...review"
            />
          </Field>
          <Field label="Facebook review link">
            <input name="facebookReviewLink" className="input" placeholder="https://facebook.com/..." />
          </Field>
          <Field label="Yelp / Trustpilot link">
            <input name="otherReviewLink" className="input" placeholder="https://yelp.com/..." />
          </Field>
        </Grid>
      </Section>

      <Section title="Tone & alerts" desc="How replies should sound and where alerts go.">
        <Grid>
          <Field label="Brand tone">
            <select name="brandTone" className="input" defaultValue="professional">
              {BRAND_TONES.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Negative review escalation email">
            <input
              name="escalationEmail"
              type="email"
              className="input"
              placeholder="owner@business.com"
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Consent" desc="Required to send any review requests.">
        <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <input type="checkbox" name="messagingConsent" className="mt-1 h-4 w-4" />
          <span className="text-sm text-gray-700">
            I confirm I will only message customers who have given permission to be contacted,
            and that I will honor opt-out requests. ReviewLoop never creates fake reviews or
            hides negative ones.
          </span>
        </label>
      </Section>

      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creating…" : "Create business & continue"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="card-body">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <p className="mb-4 text-sm text-gray-500">{desc}</p>
        {children}
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="label">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      {children}
    </div>
  );
}
