"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth/session";
import { customerSchema } from "@/lib/validation/schemas";
import { parseCustomersCsv, truthy } from "@/lib/customers/csv";

export interface CustomerFormState {
  error?: string;
  ok?: boolean;
}

const str = (v: FormDataEntryValue | null) => (v == null ? "" : String(v).trim());
const bool = (v: FormDataEntryValue | null) => v === "on" || v === "true";

export async function addCustomerAction(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const org = await requireOrg();
  const parsed = customerSchema.safeParse({
    name: str(formData.get("name")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    serviceDate: str(formData.get("serviceDate")),
    serviceType: str(formData.get("serviceType")),
    consentEmail: bool(formData.get("consentEmail")),
    consentSms: bool(formData.get("consentSms")),
    notes: str(formData.get("notes")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert({
    organization_id: org.id,
    name: d.name,
    email: d.email || null,
    phone: d.phone || null,
    service_date: d.serviceDate || null,
    service_type: d.serviceType || null,
    consent_email: d.consentEmail,
    consent_sms: d.consentSms,
    notes: d.notes || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/app/customers");
  return { ok: true };
}

/** Edit an existing customer (org-scoped; validated with the same schema). */
export async function editCustomerAction(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const org = await requireOrg();
  const id = str(formData.get("customerId"));
  if (!id) return { error: "Missing customer." };

  const parsed = customerSchema.safeParse({
    name: str(formData.get("name")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    serviceDate: str(formData.get("serviceDate")),
    serviceType: str(formData.get("serviceType")),
    consentEmail: bool(formData.get("consentEmail")),
    consentSms: bool(formData.get("consentSms")),
    notes: str(formData.get("notes")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({
      name: d.name,
      email: d.email || null,
      phone: d.phone || null,
      service_date: d.serviceDate || null,
      service_type: d.serviceType || null,
      consent_email: d.consentEmail,
      consent_sms: d.consentSms,
      notes: d.notes || null,
    })
    .eq("id", id)
    .eq("organization_id", org.id);
  if (error) return { error: error.message };

  revalidatePath("/app/customers");
  return { ok: true };
}

/** Toggle a customer's opt-out flag (compliance: never message opted-out). */
export async function setOptOutAction(formData: FormData): Promise<void> {
  const org = await requireOrg();
  const id = str(formData.get("customerId"));
  const optOut = bool(formData.get("optOut"));
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("customers")
    .update({ opt_out: optOut })
    .eq("id", id)
    .eq("organization_id", org.id);
  revalidatePath("/app/customers");
}

/**
 * Minimal CSV import. Expects a header row with columns:
 * name,email,phone,service_date,service_type,consent_email,consent_sms
 * Consent columns must be explicitly "true"/"1"/"yes" to opt the customer in.
 */
export async function importCustomersCsvAction(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const org = await requireOrg();
  const raw = str(formData.get("csv"));
  if (!raw) return { error: "Paste CSV content first." };

  const rows = parseCustomersCsv(raw);
  if (rows.length === 0) return { error: "No valid rows found." };

  const supabase = await createClient();
  const toInsert = rows.map((r) => ({
    organization_id: org.id,
    name: r.name,
    email: r.email || null,
    phone: r.phone || null,
    service_date: r.service_date || null,
    service_type: r.service_type || null,
    consent_email: truthy(r.consent_email),
    consent_sms: truthy(r.consent_sms),
  }));

  const { error } = await supabase.from("customers").insert(toInsert);
  if (error) return { error: error.message };

  revalidatePath("/app/customers");
  return { ok: true };
}
