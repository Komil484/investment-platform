import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { listPendingProjects } from "@/server/admin";
import { reviewProjectAction } from "./actions";

export const metadata: Metadata = { title: "Review projects" };

type Props = { searchParams: Promise<{ result?: string }> };

const NOTICES: Record<string, { ok: boolean; text: string }> = {
  approved: { ok: true, text: "Project approved. It is now visible to investors." },
  rejected: { ok: true, text: "Project rejected. It stays hidden from investors." },
  "already-reviewed": { ok: false, text: "That project was already reviewed, so nothing was changed." },
  invalid: { ok: false, text: "That request was not valid. Please try again." },
};

export default async function AdminProjectsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") notFound();

  const { result } = await searchParams;
  const notice = result ? NOTICES[result] : undefined;
  const projects = await listPendingProjects();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Review projects</h1>
      <p className="mt-1 text-sm text-slate-600">
        {projects.length === 1 ? "1 project is" : `${projects.length} projects are`} waiting for approval.
      </p>

      {notice && (
        <p
          role="status"
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${notice.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
        >
          {notice.text}
        </p>
      )}

      {projects.length === 0 ? (
        <p className="card mt-6 p-6 text-center text-slate-600">No projects are waiting for review.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {projects.map((project) => (
            <li key={project.id} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium tracking-wide text-emerald-700 uppercase">{project.category}</span>
                <StatusBadge status={project.status} />
              </div>
              <h2 className="mt-2 text-xl font-semibold break-words">{project.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                by {project.owner.name} ({project.owner.email}) · submitted {formatDate(project.createdAt)}
              </p>
              <p className="mt-3 text-sm leading-6 whitespace-pre-line break-words text-slate-700">
                {project.description}
              </p>
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Required investment</dt>
                  <dd className="font-semibold">{formatMoney(project.requiredAmount)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Expected annual return</dt>
                  <dd className="font-semibold">{formatPercent(project.expectedReturn)}</dd>
                </div>
              </dl>

              <form action={reviewProjectAction} className="mt-5 flex gap-3 border-t border-slate-100 pt-4">
                <input type="hidden" name="projectId" value={project.id} />
                <button type="submit" name="decision" value="APPROVED" className="btn-primary">
                  Approve
                </button>
                <button type="submit" name="decision" value="REJECTED" className="btn-secondary">
                  Reject
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}