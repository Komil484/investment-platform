import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatMoney } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getOwnerProjectProposals } from "@/server/proposals";

export const metadata: Metadata = { title: "Proposals" };

type Props = { params: Promise<{ id: string }> };

export default async function ProjectProposalsPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "OWNER") redirect("/projects");

  const project = await getOwnerProjectProposals((await params).id, user.id);
  if (!project) notFound();

  const total = project.proposals.reduce((sum, proposal) => sum + proposal.amount, 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/my-projects" className="text-sm text-slate-500 hover:text-slate-800">
        ← My projects
      </Link>

      <h1 className="mt-3 text-2xl font-semibold">Proposals for {project.name}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {project.proposals.length === 1 ? "1 proposal" : `${project.proposals.length} proposals`} ·{" "}
        {formatMoney(total)} proposed in total · {formatMoney(project.requiredAmount)} required
      </p>

      {project.proposals.length === 0 ? (
        <p className="card mt-6 p-6 text-center text-slate-600">No investor has sent a proposal yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {project.proposals.map((proposal) => (
            <li key={proposal.id} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xl font-semibold">{formatMoney(proposal.amount)}</p>
                <StatusBadge status={proposal.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                from {proposal.investor.name} ({proposal.investor.email}) · {formatDate(proposal.createdAt)}
              </p>
              <p className="mt-3 text-sm leading-6 whitespace-pre-line break-words text-slate-700">
                {proposal.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}