import type { Metadata } from "next";
import { ConfirmButton } from "@/components/ConfirmButton";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { listApprovedProjectsForAdmin, listPendingProjects, listRemovedProjects } from "@/server/admin";
import { removeProjectAction, restoreProjectAction, reviewProjectAction } from "./actions";

export const metadata: Metadata = { title: "Review projects" };

type Props = { searchParams: Promise<{ result?: string }> };

const NOTICES: Record<string, { ok: boolean; text: string }> = {
  approved: { ok: true, text: "Project approved. It is now visible to investors." },
  rejected: { ok: true, text: "Project rejected. It stays hidden from investors." },
  removed: { ok: true, text: "Project removed. It is no longer visible to investors." },
  restored: { ok: true, text: "Project restored. It is back in the review queue as Pending." },
  "not-restored": {
    ok: false,
    text: "That project could not be restored. It may already be restored, or its owner is still suspended.",
  },
  "already-reviewed": { ok: false, text: "That project was already handled, so nothing was changed." },
  invalid: { ok: false, text: "That request was not valid. Please try again." },
};

export default async function AdminProjectsPage({ searchParams }: Props) {
  await requireRole("ADMIN");

  const { result } = await searchParams;
  const notice = result ? NOTICES[result] : undefined;
  const [projects, live, removed] = await Promise.all([
    listPendingProjects(),
    listApprovedProjectsForAdmin(),
    listRemovedProjects(),
  ]);

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

      <h2 className="mt-12 text-xl font-semibold">Live projects</h2>
      <p className="mt-1 text-sm text-slate-600">
        Approved projects investors can see. Remove one if it looks suspicious.
      </p>
      {live.length === 0 ? (
        <p className="card mt-4 p-6 text-center text-slate-600">No live projects.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {live.map((project) => (
            <li key={project.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium break-words">{project.name}</p>
                <p className="text-xs text-slate-500">
                  {project.category} · {formatMoney(project.requiredAmount)} · by {project.owner.name} (
                  {project.owner.email}) · {project._count.proposals} proposals
                </p>
              </div>
              <form action={removeProjectAction}>
                <input type="hidden" name="projectId" value={project.id} />
                <ConfirmButton
                  className="btn-secondary text-red-700"
                  message={`Remove "${project.name}"? Investors will no longer see it.`}
                >
                  Remove
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-12 text-xl font-semibold">Removed projects</h2>
      <p className="mt-1 text-sm text-slate-600">
        Restoring a project puts it back in the review queue as Pending, so it is checked again before investors see it.
      </p>
      {removed.length === 0 ? (
        <p className="card mt-4 p-6 text-center text-slate-600">No removed projects.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {removed.map((project) => (
            <li key={project.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium break-words">{project.name}</p>
                <p className="text-xs text-slate-500">
                  {project.category} · {formatMoney(project.requiredAmount)} · by {project.owner.name} (
                  {project.owner.email}) · removed {formatDate(project.updatedAt)}
                </p>
              </div>
              {project.owner.suspended ? (
                <span className="text-xs text-slate-500">Unsuspend the owner first</span>
              ) : (
                <form action={restoreProjectAction}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <button type="submit" className="btn-secondary">
                    Restore
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}