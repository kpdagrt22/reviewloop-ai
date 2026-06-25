"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { credentialsSchema } from "@/lib/validation/schemas";
import { safeNextPath } from "@/lib/utils/safe-redirect";

export interface AuthState {
  error?: string;
  /** A non-error notice (e.g. "check your email to confirm"). Shown in green. */
  notice?: string;
}

/** Email/password sign up. Creates the auth user; profile row is created by trigger. */
export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }

  const supabase = await createClient();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { error: error.message };

  // If email confirmation is disabled, a session exists and we can continue.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Not an error — email confirmation is required. Show it as a notice so the
    // user isn't told (in red) that something failed when the account was created.
    return { notice: "Account created. Check your email to confirm it, then log in." };
  }
  redirect("/onboarding");
}

/** Email/password login. */
export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  redirect(safeNextPath(formData.get("next")));
}

/** Sign out and return to the marketing site. */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
