"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { REVIEW_DECISIONS, type ReviewDecision } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { reviewPendingProject } from "@/server/admin";

function isReviewDecision(value: unknown): value is ReviewDecision {
  return REVIEW_DECISIONS.some((decision) => decision === value);
}

export async function reviewProjectAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Checked again here: hiding the page is not enough, anyone can send a request to this action.
  if (user.role !== "ADMIN") redirect("/");

  const projectId = formData.get("projectId");
  const decision = formData.get("decision");
  if (typeof projectId !== "string" || !projectId || !isReviewDecision(decision)) {
    redirect("/admin/projects?result=invalid");
  }

  const updated = await reviewPendingProject(projectId, decision);

  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/my-projects");

  redirect(`/admin/projects?result=${updated ? decision.toLowerCase() : "already-reviewed"}`);
}