import type { Metadata } from "next";
import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { listApprovedCategories, listApprovedProjects } from "@/server/projects";

export const metadata: Metadata = { title: "Projects" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Empty, negative or non-numeric input is ignored instead of breaking the page.
function num(v: string | undefined) {
  if (!v?.trim()) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export default async function ProjectsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = first(params.q)?.trim().slice(0, 100) || undefined;
  const category = first(params.category) || undefined;
  const minAmount = num(first(params.minAmount));
  const maxAmount = num(first(params.maxAmount));
  const minReturn = num(first(params.minReturn));
  const filtered = Boolean(q || category || minAmount !== undefined || maxAmount !== undefined || minReturn !== undefined);

  const [projects, categories] = await Promise.all([
    listApprovedProjects({ q, category, minAmount, maxAmount, minReturn }),
    listApprovedCategories(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Investment projects</h1>

      <form method="get" role="search" className="card mt-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2">
          <label htmlFor="q" className="label">Search</label>
          <input id="q" name="q" defaultValue={q} placeholder="Name or description" className="input" />
        </div>
        <div>
          <label htmlFor="category" className="label">Category</label>
          <select id="category" name="category" defaultValue={category ?? ""} className="input">
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="minAmount" className="label">Min amount ($)</label>
          <input id="minAmount" name="minAmount" type="number" min={0} defaultValue={minAmount} className="input" />
        </div>
        <div>
          <label htmlFor="maxAmount" className="label">Max amount ($)</label>
          <input id="maxAmount" name="maxAmount" type="number" min={0} defaultValue={maxAmount} className="input" />
        </div>
        <div>
          <label htmlFor="minReturn" className="label">Min return (%)</label>
          <input id="minReturn" name="minReturn" type="number" min={0} step="any" defaultValue={minReturn} className="input" />
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <button type="submit" className="btn-primary">Apply filters</button>
          {filtered && (
            <Link href="/projects" className="btn-secondary">Clear</Link>
          )}
        </div>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        {projects.length === 1 ? "1 approved project" : `${projects.length} approved projects`}
        {filtered ? " match your filters" : ""}. Open one to see all its details.
      </p>

      {projects.length === 0 ? (
        <p className="card mt-6 p-6 text-center text-slate-600">
          {filtered ? "No projects match your filters." : "There are no approved projects yet."}
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id} className="flex">
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}