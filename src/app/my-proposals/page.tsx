import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatMoney } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { listInvestorProposals } from "@/server/proposals";

export const metadata: Metadata = { title: "My proposals" };

export default async function MyProposalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "INVESTOR") redirect("/projects");

  const proposals = await listInvestorProposals(user.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">My proposals</h1>
      <p className="mt-1 text-sm text-slate-600">
        {proposals.length === 1 ? "1 proposal" : `${proposals.length} proposals`}. The project owner decides whether
        each one is accepted or rejected.
      </p>

      {proposals.length === 0 ? (
        <section className="card mt-6 p-6 text-center">
          <p className="text-slate-600">You have not sent any proposals yet.</p>
          <Link href="/projects" className="btn-primary mt-4">
            Browse projects
          </Link>
        </section>
      ) : (
        <ul className="mt-6 space-y-4">
          {proposals.map((proposal) => (
            <li key={proposal.id} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold break-words">
                  {proposal.project.status === "APPROVED" ? (
                    <Link href={`/projects/${proposal.project.id}`} className="hover:underline">
                      {proposal.project.name}
                    </Link>
                  ) : (
                    proposal.project.name
                  )}
                </h2>
                <StatusBadge status={proposal.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                You proposed <strong className="text-slate-900">{formatMoney(proposal.amount)}</strong> ·{" "}
                {formatDate(proposal.createdAt)}
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