import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getInvestorProposal } from "@/server/proposals";
import { getApprovedProject } from "@/server/projects";
import { ProposalForm } from "./ProposalForm";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getApprovedProject((await params).id);
  return { title: project?.name ?? "Project not found" };
}

export default async function ProjectDetailPage({ params }: Props) {
  const project = await getApprovedProject((await params).id);
  if (!project) notFound();

  const user = await getCurrentUser();
  const proposal = user?.role === "INVESTOR" ? await getInvestorProposal(user.id, project.id) : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-800">
        ← All projects
      </Link>
      <article className="card mt-3 p-6">
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

      {(!user || user.role === "INVESTOR") && (
        <section className="card mt-6 p-6">
          <h2 className="font-semibold">Invest in this project</h2>
          {!user ? (
            <p className="mt-2 text-sm text-slate-600">
              <Link href="/login" className="font-medium text-emerald-700 hover:underline">
                Log in
              </Link>{" "}
              as an investor to submit a proposal.
            </p>
          ) : proposal ? (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-slate-600">You proposed</span>
                <strong>{formatMoney(proposal.amount)}</strong>
                <StatusBadge status={proposal.status} />
              </div>
              <p className="whitespace-pre-line text-slate-700">{proposal.message}</p>
              <p className="text-xs text-slate-500">Sent {formatDate(proposal.createdAt)}</p>
            </div>
          ) : (
            <div className="mt-3">
              <ProposalForm projectId={project.id} />
            </div>
          )}
        </section>
      )}
    </main>
  );
}