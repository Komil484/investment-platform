
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listOwnerProjects } from "@/server/projects";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusStyles(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "APPROVED":
      return "bg-green-50 text-green-700 ring-green-600/20";
    case "REJECTED":
      return "bg-red-50 text-red-700 ring-red-600/20";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-500/20";
  }
}

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
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            My Projects
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage your projects and track their approval status.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/projects/new"
            className="btn-primary inline-flex items-center justify-center"
          >
            Create project
          </Link>
          <Link
            href="/projects"
            className="btn-secondary inline-flex items-center justify-center"
          >
            Browse projects
          </Link>
        </div>
      </header>
     

      {projects.length === 0 ? (
        <section className="card mt-8 p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No projects yet
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            You have not submitted any projects yet.
          </p>
          <Link href="/projects/new" className="btn-primary mt-5">
            Create your first project
          </Link>
        </section>
      ) : (
        <section className="mt-8 space-y-4" aria-label="Your projects">
          <p className="text-sm text-slate-500">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>

          {projects.map((project) => (
            <article
              key={project.id}
              className="card p-5 transition-shadow hover:shadow-md sm:p-6"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-xl font-semibold text-slate-900">
                    {project.name}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {project.category}
                  </p>

                  <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                    {project.description}
                  </p>

                  <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Required investment
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-900">
                        {formatCurrency(project.requiredAmount)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Expected return
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-900">
                        {project.expectedReturn}%
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex shrink-0 flex-row flex-wrap items-center gap-3 sm:flex-col sm:items-end">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyles(project.status)}`}
                  >
                    {project.status.charAt(0) +
                      project.status.slice(1).toLowerCase()}
                  </span>

                  {project.status === "PENDING" && (
                    <Link
                      href={`/projects/${project.id}/edit`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Edit project →
                    </Link>
                  )}
                  
                  {project.status === "APPROVED" && (
                    <Link
                      href={`/my-projects/${project.id}/proposals`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      View proposals ({project._count.proposals}) →
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
