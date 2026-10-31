
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getEditableProject } from "@/server/projects";
import { EditProjectForm } from "./EditProjectForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "OWNER") {
    notFound();
  }

  const project = await getEditableProject(id, user.id);

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/my-projects"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← My projects
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Edit project
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Update your project details while it is awaiting approval.
        </p>
      </div>

      <div className="card mt-6 p-6">
        <EditProjectForm project={project} />
      </div>
    </main>
  );
}
