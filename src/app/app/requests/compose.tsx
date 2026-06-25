"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { renderDefaultRequest } from "@/lib/messaging/templates";
import { canMessage } from "@/lib/messaging/eligibility";
import { createRequestAction, type RequestActionState } from "./actions";

export interface ComposeCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  consent_email: boolean;
  consent_sms: boolean;
  opt_out: boolean;
}

export function ComposeRequest({
  customers,
  businessName,
  reviewLink,
  preselectedId,
}: {
  customers: ComposeCustomer[];
  businessName: string;
  reviewLink: string;
  preselectedId?: string;
}) {
  const [customerId, setCustomerId] = useState(
    preselectedId && customers.some((c) => c.id === preselectedId)
      ? preselectedId
      : customers[0]?.id ?? "",
  );
  const [channel, setChannel] = useState<"manual" | "email" | "sms">("manual");
  const [state, formAction, pending] = useActionState<RequestActionState, FormData>(
    createRequestAction,
    {},
  );

  const customer = customers.find((c) => c.id === customerId);

  const message = useMemo(() => {
    if (!customer) return { subject: "", body: "" };
    return renderDefaultRequest({
      customerName: customer.name,
      businessName,
      reviewLink,
    });
  }, [customer, businessName, reviewLink]);

  const channelEligibility =
    customer && channel !== "manual" ? canMessage(customer, channel) : { eligible: true };

  return (
    <div className="card">
      <div className="card-body space-y-4">
        <h2 className="font-semibold text-gray-900">Compose review request</h2>

        {customers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-gray-500">
            Add a customer first to send a request.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Customer</label>
                <select
                  className="input"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.opt_out ? " (opted out)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Channel</label>
                <select
                  className="input"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as typeof channel)}
                >
                  <option value="manual">Manual (copy &amp; send yourself)</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
            </div>

            {/* Message preview */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              {channel === "email" ? (
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Subject: <span className="font-normal">{message.subject}</span>
                </p>
              ) : null}
              <p className="whitespace-pre-wrap text-sm text-gray-700">{message.body}</p>
            </div>

            {customer?.opt_out ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                This customer has opted out and should not be messaged.
              </p>
            ) : null}

            {channel !== "manual" && !channelEligibility.eligible ? (
              <p className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                {channelEligibility.reason} Use manual mode or update their consent.
              </p>
            ) : null}

            {state.error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
            ) : null}
            {state.ok ? (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                Request recorded. {state.message}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <CopyButton text={message.body} label="Copy message" />
              <CopyButton text={reviewLink} label="Copy review link" />
              <form action={formAction} className="contents">
                <input type="hidden" name="customerId" value={customerId} />
                <input type="hidden" name="channel" value={channel} />
                <Button
                  type="submit"
                  disabled={
                    pending ||
                    !!customer?.opt_out ||
                    (channel !== "manual" && !channelEligibility.eligible)
                  }
                >
                  {pending
                    ? "Working…"
                    : channel === "manual"
                      ? "Mark as sent"
                      : `Send ${channel}`}
                </Button>
              </form>
            </div>
            <p className="text-xs text-gray-400">
              We never pressure customers for only-positive reviews or hide negative ones.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
