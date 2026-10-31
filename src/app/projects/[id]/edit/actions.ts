
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

import { updatePendingProject } from "@/server/projects";
import { formNumber, updateProjectSchema } from "@/lib/validation";
export async function updateProjectAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "OWNER") {
    redirect("/projects");
  }

  const projectId = formData.get("projectId");

  if (typeof projectId !== "string" || !projectId.trim()) {
    redirect("/my-projects?error=invalid-project");
  }

  const input = updateProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    requiredAmount: formNumber(formData.get("requiredAmount")),
    expectedReturn: formNumber(formData.get("expectedReturn")),
  });

  if (!input.success) {
    redirect(`/projects/${encodeURIComponent(projectId)}/edit?error=invalid-input`);
  }

  const updated = await updatePendingProject(
    projectId,
    user.id,
    input.data,
  );

  if (!updated) {
    redirect(`/projects/${encodeURIComponent(projectId)}/edit?error=not-editable`);
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/my-projects");

  redirect("/my-projects?updated=1");
}
