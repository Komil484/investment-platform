"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createProjectSchema } from "@/lib/validation";
import { createProject } from "@/server/projects";

export type CreateProjectState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[] | undefined> };

// An empty field must not turn into 0, so it becomes NaN and fails validation.
function toNumber(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
}

export async function createProjectAction(
  _prev: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Checked here as well as in the page: anyone can send a request to this action.
  if (user.role !== "OWNER") redirect("/projects");
  if (!user.verified) {
    return {
      status: "error",
      message: "Your account must be verified by an administrator before you can create projects.",
    };
  }

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    requiredAmount: toNumber(formData.get("requiredAmount")),
    expectedReturn: toNumber(formData.get("expectedReturn")),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await createProject(user.id, parsed.data);

  revalidatePath("/my-projects");
  redirect("/my-projects");
}