import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ProposalDecision } from "@/lib/constants";
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

export class ProposalAmountError extends Error {
  constructor(public max: number) {
    super(`A proposal cannot be more than the amount the project needs ($${max.toLocaleString("en-US")}).`);
  }
}

export class ProposalOverfundedError extends Error {
  constructor() {
    super("Accepting this proposal would raise more than the project needs.");
  }
}

// US-04 / FR-7: an investor proposes an amount for an approved project.
export async function submitProposal(investorId: string, projectId: string, input: ProposalInput) {
  const project = await db.project.findFirst({
    where: { id: projectId, status: "APPROVED" },
    select: { id: true, requiredAmount: true },
  });
  if (!project) throw new ProposalNotAllowedError();
  if (input.amount > project.requiredAmount) throw new ProposalAmountError(project.requiredAmount);

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

// US-07 / FR-8: a project owner's view of the proposals sent to one of their projects.
// Returns null if the project does not exist or belongs to someone else. Newest proposals come first.
export async function getOwnerProjectProposals(projectId: string, ownerId: string) {
  return db.project.findFirst({
    where: { id: projectId, ownerId },
    select: {
      id: true,
      name: true,
      status: true,
      requiredAmount: true,
      proposals: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          message: true,
          status: true,
          createdAt: true,
          investor: { select: { name: true, email: true } },
        },
      },
    },
  });
}

/**
 * US-07 / FR-10: the owner of a project accepts or rejects a proposal sent to it.
 * Only a PENDING proposal on the owner's own APPROVED project can be changed, and a decision is final.
 * Accepted proposals can never add up to more than the project needs (throws ProposalOverfundedError).
 * Returns true if the proposal was updated.
 */
export async function reviewProposal(
  ownerId: string,
  projectId: string,
  proposalId: string,
  decision: ProposalDecision,
) {
  return db.$transaction(async (tx) => {
    const proposal = await tx.proposal.findFirst({
      where: { id: proposalId, projectId, status: "PENDING", project: { ownerId, status: "APPROVED" } },
      select: { amount: true, project: { select: { requiredAmount: true } } },
    });
    if (!proposal) return false;

    if (decision === "ACCEPTED") {
      const accepted = await tx.proposal.aggregate({
        where: { projectId, status: "ACCEPTED" },
        _sum: { amount: true },
      });
      if ((accepted._sum.amount ?? 0) + proposal.amount > proposal.project.requiredAmount) {
        throw new ProposalOverfundedError();
      }
    }

    const result = await tx.proposal.updateMany({
      where: { id: proposalId, status: "PENDING" },
      data: { status: decision },
    });
    return result.count === 1;
  });
}

// US-04 / FR-10: every proposal an investor has sent, newest first, with the project it belongs to.
export async function listInvestorProposals(investorId: string) {
  return db.proposal.findMany({
    where: { investorId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      message: true,
      status: true,
      createdAt: true,
      project: { select: { id: true, name: true, status: true } },
    },
  });
}
