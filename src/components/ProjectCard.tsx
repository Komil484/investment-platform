import Link from "next/link";
import { formatMoney, formatPercent, truncate } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

type Props = {
  project: {
    id: string;
    name: string;
    description: string;
    category: string;
    requiredAmount: number;
    expectedReturn: number;
    status: string;
  };
};

export function ProjectCard({ project }: Props) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="card flex flex-col p-5 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium tracking-wide text-emerald-700 uppercase">{project.category}</span>
        <StatusBadge status={project.status} />
      </div>
      <h2 className="mt-2 text-lg font-semibold">{project.name}</h2>
      <p className="mt-1 flex-1 text-sm text-slate-600">{truncate(project.description)}</p>
      <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Required investment</dt>
          <dd className="font-semibold">{formatMoney(project.requiredAmount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Expected annual return</dt>
          <dd className="font-semibold">{formatPercent(project.expectedReturn)}</dd>
        </div>
      </dl>
    </Link>
  );
}
