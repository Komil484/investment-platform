"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { formNumber, updateProjectSchema } from "@/lib/validation";
import { updatePendingProject } from "@/server/projects";

type EditProjectValues = {
  name: string;
  description: string;
  category: string;
  requiredAmount: string;
  expectedReturn: string;
};

// `values` is what the owner typed, so the form can show it again after an error.
export type EditProjectState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
      values: EditProjectValues;
    };

export async function updateProjectAction(_prev: EditProjectState, formData: FormData): Promise<EditProjectState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Checked here as well as in the page: anyone can send a request to this action.
  if (user.role !== "OWNER") redirect("/projects");

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId.trim()) redirect("/my-projects");

  const text = (key: string) => String(formData.get(key) ?? "");
  const values = {
    name: text("name"),
    description: text("description"),
    category: text("category"),
    requiredAmount: text("requiredAmount"),
    expectedReturn: text("expectedReturn"),
  };

  const parsed = updateProjectSchema.safeParse({
    name: values.name,
    description: values.description,
    category: values.category,
    requiredAmount: formNumber(formData.get("requiredAmount")),
    expectedReturn: formNumber(formData.get("expectedReturn")),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const updated = await updatePendingProject(projectId, user.id, parsed.data);
  if (!updated) {
    return {
      status: "error",
      message: "This project can no longer be edited. It may have been approved or rejected in the meantime.",
      values,
    };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/my-projects");
  redirect("/my-projects?updated=1");
}
