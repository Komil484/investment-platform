"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createProjectAction, type CreateProjectState } from "./actions";

const initialState: CreateProjectState = { status: "idle" };

export function CreateProjectForm() {
  const [state, formAction, pending] = useActionState(createProjectAction, initialState);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <div>
        <label htmlFor="name" className="label">
          Project name
        </label>
        <input id="name" name="name" required minLength={3} maxLength={150} className="input" />
        <FieldError messages={fieldErrors?.name} />
      </div>
      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={20}
          maxLength={5000}
          rows={6}
          className="input"
        />
        <p className="mt-1 text-xs text-slate-500">At least 20 characters.</p>
        <FieldError messages={fieldErrors?.description} />
      </div>
      <div>
        <label htmlFor="category" className="label">
          Category
        </label>
        <input id="category" name="category" required minLength={2} maxLength={100} className="input" />
        <FieldError messages={fieldErrors?.category} />
      </div>
      <div>
        <label htmlFor="requiredAmount" className="label">
          Required investment (USD)
        </label>
        <input id="requiredAmount" name="requiredAmount" type="number" required min={1} step={1} className="input" />
        <FieldError messages={fieldErrors?.requiredAmount} />
      </div>
      <div>
        <label htmlFor="expectedReturn" className="label">
          Expected annual return (%)
        </label>
        <input
          id="expectedReturn"
          name="expectedReturn"
          type="number"
          required
          min={0}
          max={100}
          step="any"
          className="input"
        />
        <FieldError messages={fieldErrors?.expectedReturn} />
      </div>
      {state.status === "error" && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Creating…" : "Create project"}
        </button>
        <Link href="/my-projects" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{messages[0]}</p>;
}