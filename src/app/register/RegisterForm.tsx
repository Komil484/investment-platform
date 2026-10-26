"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ROLE_LABELS, SIGNUP_ROLES } from "@/lib/constants";
import { register, type RegisterState } from "./actions";

const initialState: RegisterState = { status: "idle" };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState);

  if (state.status === "success") {
    return (
      <div className="card p-6 text-center">
        <h2 className="text-lg font-semibold">Account created</h2>
        <p className="mt-2 text-sm text-slate-600">Welcome, {state.name}. Your account is ready.</p>
        <Link href="/login" className="btn-primary mt-4">
          Log in
        </Link>
      </div>
    );
  }

  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <Field id="name" label="Full name" error={fieldErrors?.name}>
        <input id="name" name="name" required autoComplete="name" className="input" />
      </Field>
      <Field id="email" label="Email" error={fieldErrors?.email}>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </Field>
      <Field id="password" label="Password" error={fieldErrors?.password}>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="input"
        />
        <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
      </Field>
      <fieldset>
        <legend className="label">I am joining as</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SIGNUP_ROLES.map((role, i) => (
            <label
              key={role}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-300 p-3 text-sm font-medium has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"
            >
              <input type="radio" name="role" value={role} defaultChecked={i === 0} className="accent-emerald-600" />
              {ROLE_LABELS[role]}
            </label>
          ))}
        </div>
        <FieldError messages={fieldErrors?.role} />
      </fieldset>
      {state.status === "error" && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string[]; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      <FieldError messages={error} />
    </div>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{messages[0]}</p>;
}
