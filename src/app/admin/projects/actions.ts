"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { REVIEW_DECISIONS, type ReviewDecision } from "@/lib/constants";
import { requireRole } from "@/lib/session";
import { removeProject, reviewPendingProject } from "@/server/admin";

function isReviewDecision(value: unknown): value is ReviewDecision {
  return REVIEW_DECISIONS.some((decision) => decision === value);
}

function refresh(projectId: string) {
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/my-projects");
}

export async function reviewProjectAction(formData: FormData) {
  await requireRole("ADMIN");

  const projectId = formData.get("projectId");
  const decision = formData.get("decision");
  if (typeof projectId !== "string" || !projectId || !isReviewDecision(decision)) {
    redirect("/admin/projects?result=invalid");
  }

  const updated = await reviewPendingProject(projectId, decision);
  refresh(projectId);
  redirect(`/admin/projects?result=${updated ? decision.toLowerCase() : "already-reviewed"}`);
}

export async function removeProjectAction(formData: FormData) {
  await requireRole("ADMIN");

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) redirect("/admin/projects?result=invalid");

  const removed = await removeProject(projectId);
  refresh(projectId);
  redirect(`/admin/projects?result=${removed ? "removed" : "already-reviewed"}`);
}