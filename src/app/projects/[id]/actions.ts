"use server";


import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { proposalSchema } from "@/lib/validation";
import { ProposalExistsError, ProposalNotAllowedError, submitProposal } from "@/server/proposals";

export type ProposalState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[] | undefined> }
  | { status: "success" };

export async function submitProposalAction(_prev: ProposalState, formData: FormData): Promise<ProposalState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Checked here as well as in the page: anyone can send a request to this action.
  if (user.role !== "INVESTOR") return { status: "error", message: "Only investors can submit proposals." };

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) {
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  const parsed = proposalSchema.safeParse({
    amount: Number(formData.get("amount")),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await submitProposal(user.id, projectId, parsed.data);
  } catch (err) {
    if (err instanceof ProposalNotAllowedError || err instanceof ProposalExistsError) {
      return { status: "error", message: err.message };
    }
    throw err;
  }

  revalidatePath(`/projects/${projectId}`);
  return { status: "success" };
}