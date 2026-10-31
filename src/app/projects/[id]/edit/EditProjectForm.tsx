"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateProjectAction, type EditProjectState } from "./actions";

type Props = {
  project: {
    id: string;
    name: string;
    description: string;
    category: string;
    requiredAmount: number;
    expectedReturn: number;
  };
};

const initialState: EditProjectState = { status: "idle" };

export function EditProjectForm({ project }: Props) {
  const [state, formAction, pending] = useActionState(updateProjectAction, initialState);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;
  // React clears the form after each submit, so after an error show what the owner typed,
  // otherwise the saved project.
  const values =
    state.status === "error"
      ? state.values
      : {
          name: project.name,
          description: project.description,
          category: project.category,
          requiredAmount: String(project.requiredAmount),
          expectedReturn: String(project.expectedReturn),
        };

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={project.id} />
      <div>
        <label htmlFor="name" className="label">
          Project name
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={3}
          maxLength={150}
          defaultValue={values.name}
          className="input"
        />
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
          defaultValue={values.description}
          className="input"
        />
        <p className="mt-1 text-xs text-slate-500">At least 20 characters.</p>
        <FieldError messages={fieldErrors?.description} />
      </div>
      <div>
        <label htmlFor="category" className="label">
          Category
        </label>
        <input
          id="category"
          name="category"
          required
          minLength={2}
          maxLength={100}
          defaultValue={values.category}
          className="input"
        />
        <FieldError messages={fieldErrors?.category} />
      </div>
      <div>
        <label htmlFor="requiredAmount" className="label">
          Required investment (USD)
        </label>
        <input
          id="requiredAmount"
          name="requiredAmount"
          type="number"
          required
          min={1}
          step={1}
          defaultValue={values.requiredAmount}
          className="input"
        />
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
          defaultValue={values.expectedReturn}
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
          {pending ? "Saving…" : "Save changes"}
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
