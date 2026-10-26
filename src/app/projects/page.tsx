import type { Metadata } from "next";
import { ProjectCard } from "@/components/ProjectCard";
import { listApprovedProjects } from "@/server/projects";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const projects = await listApprovedProjects();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Investment projects</h1>
      <p className="mt-1 text-sm text-slate-600">
        {projects.length === 1 ? "1 approved project" : `${projects.length} approved projects`}. Open one to see all
        its details.
      </p>

      {projects.length === 0 ? (
        <p className="card mt-6 p-6 text-center text-slate-600">There are no approved projects yet.</p>
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
