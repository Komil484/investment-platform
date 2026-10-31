import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ProposalInput } from "@/lib/validation";

export class ProposalNotAllowedError extends Error {
  constructor() {
    super("This project is not open for proposals.");
  }
}

export class ProposalExistsError extends Error {
  constructor() {
    super("You have already submitted a proposal for this project.");
  }
}

// US-04 / FR-7: an investor proposes an amount for an approved project.
export async function submitProposal(investorId: string, projectId: string, input: ProposalInput) {
  const project = await db.project.findFirst({
    where: { id: projectId, status: "APPROVED" },
    select: { id: true },
  });
  if (!project) throw new ProposalNotAllowedError();

  try {
    return await db.proposal.create({
      data: { projectId, investorId, amount: input.amount, message: input.message },
      select: { id: true },
    });
  } catch (err) {
    // Unique constraint on (projectId, investorId); checked here instead of a prior lookup to avoid a race.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ProposalExistsError();
    }
    throw err;
  }
}

// The investor's own proposal for a project, or null if they have not sent one.
export async function getInvestorProposal(investorId: string, projectId: string) {
  return db.proposal.findUnique({
    where: { projectId_investorId: { projectId, investorId } },
    select: { amount: true, message: true, status: true, createdAt: true },
  });
}