import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { CreateProjectForm } from "./CreateProjectForm";

export const metadata: Metadata = { title: "Create project" };

export default async function NewProjectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "OWNER") redirect("/projects");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/my-projects" className="text-sm text-slate-500 hover:text-slate-800">
        ← My projects
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Create a project</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600">
        New projects start as Pending. Investors can see yours once an administrator approves it, and you can edit it
        until then.
      </p>
      {user.verified ? (
        <CreateProjectForm />
      ) : (
        <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Your account is waiting for administrator verification. You can create projects once it is verified.
        </p>
      )}
    </main>
  );
}