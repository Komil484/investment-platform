
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listOwnerProjects } from "@/server/projects";

export default async function MyProjectsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "OWNER") {
    redirect("/projects");
  }

  const projects = await listOwnerProjects(user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            My Projects
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage your submitted projects and their approval status.
          </p>
        </div>

        <Link href="/projects" className="btn-primary">
          Browse projects
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        {projects.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-slate-600">
             You have not submitted any projects yet.
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <article key={project.id} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold">
                    {project.name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    {project.category}
                  </p>

                  <p className="mt-3 text-sm text-slate-700">
                    {project.description}
                  </p>

                  <p className="mt-3 text-sm text-slate-600">
                    Required investment: $
                    {project.requiredAmount.toLocaleString()}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Expected return: {project.expectedReturn}%
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                    {project.status}
                  </span>

                  {project.status === "PENDING" && (
                    <Link
                      href={`/projects/${project.id}/edit`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Edit project →
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
