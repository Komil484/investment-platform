
import { updateProjectAction } from "./actions";

type ProjectFormData = {
  id: string;
  name: string;
  description: string;
  category: string;
  requiredAmount: number;
  expectedReturn: number;
};

type Props = {
  project: ProjectFormData;
  error?: string;
};

export function EditProjectForm({ project, error }: Props) {
  return (
    <form action={updateProjectAction} className="space-y-5">
      <input type="hidden" name="projectId" value={project.id} />

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error === "invalid-input"
            ? "Please check your entries and try again."
            : error === "not-editable"
              ? "This project can no longer be edited. It may have been approved or its ownership changed."
              : "Something went wrong. Please try again."}
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Project name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={3}
          maxLength={150}
          defaultValue={project.name}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={20}
          maxLength={5000}
          rows={6}
          defaultValue={project.description}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium">
          Category
        </label>
        <input
          id="category"
          name="category"
          type="text"
          required
          minLength={2}
          maxLength={100}
          defaultValue={project.category}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label
          htmlFor="requiredAmount"
          className="mb-1 block text-sm font-medium"
        >
          Required investment (USD)
        </label>
        <input
          id="requiredAmount"
          name="requiredAmount"
          type="number"
          required
          min={1}
          step={1}
          defaultValue={project.requiredAmount}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label
          htmlFor="expectedReturn"
          className="mb-1 block text-sm font-medium"
        >
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
          defaultValue={project.expectedReturn}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary">
          Save changes
        </button>

        <a
          href="/my-projects"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
