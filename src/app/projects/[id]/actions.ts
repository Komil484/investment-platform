"use server";


import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { proposalSchema } from "@/lib/validation";
import {
  ProposalAmountError,
  ProposalExistsError,
  ProposalNotAllowedError,
  submitProposal,
} from "@/server/proposals";

// `values` is what the investor typed, so the form can show it again after an error.
type ProposalValues = { amount: string; message: string };

export type ProposalState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
      values?: ProposalValues;
    }
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

  const values = { amount: String(formData.get("amount") ?? ""), message: String(formData.get("message") ?? "") };
  const parsed = proposalSchema.safeParse({
    amount: Number(formData.get("amount")),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  try {
    await submitProposal(user.id, projectId, parsed.data);
  } catch (err) {
    if (err instanceof ProposalAmountError) {
      return { status: "error", message: err.message, fieldErrors: { amount: [err.message] }, values };
    }
    if (err instanceof ProposalNotAllowedError || err instanceof ProposalExistsError) {
      return { status: "error", message: err.message, values };
    }
    throw err;
  }

  revalidatePath(`/projects/${projectId}`);
  return { status: "success" };
}