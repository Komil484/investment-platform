"use client";

import { useActionState } from "react";
import { submitProposalAction, type ProposalState } from "./actions";

const initialState: ProposalState = { status: "idle" };

export function ProposalForm({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(submitProposalAction, initialState);

  if (state.status === "success") {
    return (
      <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        Proposal sent. The project owner will review it.
      </p>
    );
  }

  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <div>
        <label htmlFor="amount" className="label">
          Proposed investment (USD)
        </label>
        <input id="amount" name="amount" type="number" required min={1} step={1} className="input" />
        <FieldError messages={fieldErrors?.amount} />
      </div>
      <div>
        <label htmlFor="message" className="label">
          Message to the project owner
        </label>
        <textarea id="message" name="message" required minLength={10} maxLength={1000} rows={4} className="input" />
        <FieldError messages={fieldErrors?.message} />
      </div>
      {state.status === "error" && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Sending…" : "Submit proposal"}
      </button>
    </form>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{messages[0]}</p>;
}