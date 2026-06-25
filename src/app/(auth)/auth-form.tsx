"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signInAction, signUpAction, type AuthState } from "./actions";

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "signup";
  next?: string;
}) {
  const action = mode === "login" ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {mode === "signup" ? (
        <div>
          <label className="label" htmlFor="fullName">
            Your name
          </label>
          <input id="fullName" name="fullName" className="input" placeholder="Jordan Smith" />
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="input"
          placeholder="you@business.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="input"
          placeholder="At least 8 characters"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>

      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
      </Button>

      <p className="text-center text-sm text-gray-500">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="font-medium text-brand-600 hover:underline">
              Start Review Loop
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
