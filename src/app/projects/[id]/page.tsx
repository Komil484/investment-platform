import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { getApprovedProject } from "@/server/projects";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getApprovedProject((await params).id);
  return { title: project?.name ?? "Project not found" };
}

export default async function ProjectDetailPage({ params }: Props) {
  const project = await getApprovedProject((await params).id);
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <article className="card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium tracking-wide text-emerald-700 uppercase">{project.category}</span>
          <StatusBadge status={project.status} />
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{project.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          by {project.owner.name} · listed {formatDate(project.createdAt)}
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">Required investment</dt>
            <dd className="text-xl font-semibold">{formatMoney(project.requiredAmount)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Expected annual return</dt>
            <dd className="text-xl font-semibold">{formatPercent(project.expectedReturn)}</dd>
          </div>
        </dl>

        <h2 className="mt-8 font-semibold">About this project</h2>
        <p className="mt-2 whitespace-pre-line text-slate-700">{project.description}</p>
      </article>
    </main>
  );
}
