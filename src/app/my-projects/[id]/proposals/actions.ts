"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PROPOSAL_DECISIONS, type ProposalDecision } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { reviewProposal } from "@/server/proposals";

function isProposalDecision(value: unknown): value is ProposalDecision {
  return PROPOSAL_DECISIONS.some((decision) => decision === value);
}

export async function reviewProposalAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Checked again here: hiding the buttons is not enough, anyone can send a request to this action.
  if (user.role !== "OWNER") redirect("/projects");

  const projectId = formData.get("projectId");
  const proposalId = formData.get("proposalId");
  const decision = formData.get("decision");
  if (typeof projectId !== "string" || !projectId) redirect("/my-projects");

  const page = `/my-projects/${encodeURIComponent(projectId)}/proposals`;
  if (typeof proposalId !== "string" || !proposalId || !isProposalDecision(decision)) {
    redirect(`${page}?result=invalid`);
  }

  const updated = await reviewProposal(user.id, projectId, proposalId, decision);

  revalidatePath(page);
  revalidatePath(`/projects/${projectId}`);

  redirect(`${page}?result=${updated ? decision.toLowerCase() : "already-reviewed"}`);
}