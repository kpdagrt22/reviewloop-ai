"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { editCustomerAction, type CustomerFormState } from "./actions";

export interface EditableCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  service_date: string | null;
  service_type: string | null;
  consent_email: boolean;
  consent_sms: boolean;
  notes: string | null;
}

export function EditCustomerButton({ customer }: { customer: EditableCustomer }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState<CustomerFormState, FormData>(
    editCustomerAction,
    {},
  );

  // Close the dialog once a save succeeds.
  useEffect(() => {
    if (state.ok) dialogRef.current?.close();
  }, [state.ok]);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => dialogRef.current?.showModal()}
      >
        Edit
      </Button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-lg rounded-xl p-0 backdrop:bg-black/30"
      >
        <form action={formAction} className="card-body space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Edit customer</h3>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <input type="hidden" name="customerId" value={customer.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Name *</label>
              <input name="name" required defaultValue={customer.name} className="input" />
            </div>
            <div>
              <label className="label">Service type</label>
              <input name="serviceType" defaultValue={customer.service_type ?? ""} className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" defaultValue={customer.email ?? ""} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" defaultValue={customer.phone ?? ""} className="input" />
            </div>
            <div>
              <label className="label">Service date</label>
              <input
                name="serviceDate"
                type="date"
                defaultValue={customer.service_date ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input name="notes" defaultValue={customer.notes ?? ""} className="input" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 rounded-lg bg-gray-50 p-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="consentEmail" defaultChecked={customer.consent_email} className="h-4 w-4" />
              Consent to email
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="consentSms" defaultChecked={customer.consent_sms} className="h-4 w-4" />
              Consent to SMS
            </label>
          </div>

          {state.error ? <p className="field-error">{state.error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
