import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  getInvestorProposal,
  ProposalExistsError,
  ProposalNotAllowedError,
  submitProposal,
} from "@/server/proposals";

const input = { amount: 25000, message: "I would like to invest in this project." };

const project = (ownerId: string, status: string) => ({
  ownerId,
  status,
  name: `${status} project`,
  description: "A project used in tests.",
  category: "Technology",
  requiredAmount: 50000,
  expectedReturn: 12.5,
});

let ownerId: string;
let investorId: string;

beforeEach(async () => {
  await db.user.deleteMany();
  ownerId = (
    await db.user.create({
      data: { name: "Omar Owner", email: "owner@example.com", passwordHash: "x", role: "OWNER" },
    })
  ).id;
  investorId = (
    await db.user.create({
      data: { name: "Ian Investor", email: "investor@example.com", passwordHash: "x", role: "INVESTOR" },
    })
  ).id;
});

describe("submitProposal", () => {
  it("creates a pending proposal for an approved project", async () => {
    const { id: projectId } = await db.project.create({ data: project(ownerId, "APPROVED") });

    const { id } = await submitProposal(investorId, projectId, input);

    expect(await db.proposal.findUnique({ where: { id } })).toMatchObject({
      projectId,
      investorId,
      amount: 25000,
      message: input.message,
      status: "PENDING",
    });
  });

  it.each(["PENDING", "REJECTED"])("does not accept a proposal for a %s project", async (status) => {
    const { id: projectId } = await db.project.create({ data: project(ownerId, status) });

    await expect(submitProposal(investorId, projectId, input)).rejects.toBeInstanceOf(ProposalNotAllowedError);
    expect(await db.proposal.count()).toBe(0);
  });

  it("does not accept a proposal for an unknown project", async () => {
    await expect(submitProposal(investorId, "does-not-exist", input)).rejects.toBeInstanceOf(
      ProposalNotAllowedError,
    );
  });

  it("allows only one proposal per investor per project", async () => {
    const { id: projectId } = await db.project.create({ data: project(ownerId, "APPROVED") });
    await submitProposal(investorId, projectId, input);

    await expect(submitProposal(investorId, projectId, input)).rejects.toBeInstanceOf(ProposalExistsError);

    const other = await db.user.create({
      data: { name: "Ivy Investor", email: "ivy@example.com", passwordHash: "x", role: "INVESTOR" },
    });
    await expect(submitProposal(other.id, projectId, input)).resolves.toBeDefined();
    expect(await db.proposal.count()).toBe(2);
  });
});

describe("getInvestorProposal", () => {
  it("returns the investor's own proposal, or null", async () => {
    const { id: projectId } = await db.project.create({ data: project(ownerId, "APPROVED") });
    expect(await getInvestorProposal(investorId, projectId)).toBeNull();

    await submitProposal(investorId, projectId, input);
    expect(await getInvestorProposal(investorId, projectId)).toMatchObject({ amount: 25000, status: "PENDING" });
  });
});