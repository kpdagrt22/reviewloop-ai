"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  addCustomerAction,
  importCustomersCsvAction,
  type CustomerFormState,
} from "./actions";

export function AddCustomerPanel() {
  const [tab, setTab] = useState<"single" | "csv">("single");
  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-4 flex gap-2">
          <TabButton active={tab === "single"} onClick={() => setTab("single")}>
            Add customer
          </TabButton>
          <TabButton active={tab === "csv"} onClick={() => setTab("csv")}>
            Import CSV
          </TabButton>
        </div>
        {tab === "single" ? <SingleForm /> : <CsvForm />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
        active ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function SingleForm() {
  const [state, formAction, pending] = useActionState<CustomerFormState, FormData>(
    addCustomerAction,
    {},
  );
  return (
    <form action={formAction} className="space-y-3" key={state.ok ? "reset" : "form"}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Name *</label>
          <input name="name" required className="input" placeholder="Customer name" />
        </div>
        <div>
          <label className="label">Service type</label>
          <input name="serviceType" className="input" placeholder="Drain cleaning" />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" className="input" placeholder="customer@email.com" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" className="input" placeholder="+1 555 222 3333" />
        </div>
        <div>
          <label className="label">Service date</label>
          <input name="serviceDate" type="date" className="input" />
        </div>
        <div>
          <label className="label">Notes</label>
          <input name="notes" className="input" placeholder="Optional" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4 rounded-lg bg-gray-50 p-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="consentEmail" className="h-4 w-4" />
          Consent to email
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="consentSms" className="h-4 w-4" />
          Consent to SMS
        </label>
      </div>
      {state.error ? <p className="field-error">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-green-600">Customer added.</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add customer"}
      </Button>
    </form>
  );
}

function CsvForm() {
  const [state, formAction, pending] = useActionState<CustomerFormState, FormData>(
    importCustomersCsvAction,
    {},
  );
  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-gray-500">
        Paste CSV with header:{" "}
        <code className="rounded bg-gray-100 px-1 text-xs">
          name,email,phone,service_date,service_type,consent_email,consent_sms
        </code>
      </p>
      <textarea
        name="csv"
        rows={6}
        className="input font-mono text-xs"
        placeholder={"name,email,phone,service_date,service_type,consent_email,consent_sms\nJane Doe,jane@email.com,,2026-06-01,Haircut,true,false"}
      />
      {state.error ? <p className="field-error">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-green-600">Customers imported.</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Importing…" : "Import customers"}
      </Button>
    </form>
  );
}
