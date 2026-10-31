import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { reviewProposal } from "@/server/proposals";

let ownerId: string;
let otherOwnerId: string;
let investorId: string;
let projectId: string;

const user = (name: string, email: string, role: string) =>
  db.user.create({ data: { name, email, passwordHash: "x", role } });

const proposal = (status = "PENDING") =>
  db.proposal.create({ data: { projectId, investorId, amount: 10000, message: "An offer.", status } });

beforeEach(async () => {
  await db.user.deleteMany();
  ownerId = (await user("Omar Owner", "owner@example.com", "OWNER")).id;
  otherOwnerId = (await user("Other Owner", "other-owner@example.com", "OWNER")).id;
  investorId = (await user("Ian Investor", "ian@example.com", "INVESTOR")).id;
  projectId = (
    await db.project.create({
      data: {
        ownerId,
        status: "APPROVED",
        name: "Approved project",
        description: "A project used in tests.",
        category: "Technology",
        requiredAmount: 50000,
        expectedReturn: 12.5,
      },
    })
  ).id;
});

describe("reviewProposal", () => {
  it.each(["ACCEPTED", "REJECTED"] as const)("lets the owner set a pending proposal to %s", async (decision) => {
    const { id } = await proposal();

    expect(await reviewProposal(ownerId, projectId, id, decision)).toBe(true);
    expect(await db.proposal.findUnique({ where: { id } })).toMatchObject({ status: decision });
  });

  it.each(["ACCEPTED", "REJECTED"])("does not change a proposal that is already %s", async (status) => {
    const { id } = await proposal(status);

    expect(await reviewProposal(ownerId, projectId, id, status === "ACCEPTED" ? "REJECTED" : "ACCEPTED")).toBe(false);
    expect(await db.proposal.findUnique({ where: { id } })).toMatchObject({ status });
  });

  it("does not let another owner decide", async () => {
    const { id } = await proposal();

    expect(await reviewProposal(otherOwnerId, projectId, id, "ACCEPTED")).toBe(false);
    expect(await db.proposal.findUnique({ where: { id } })).toMatchObject({ status: "PENDING" });
  });

  it("does not change a proposal when the project id does not match", async () => {
    const { id } = await proposal();

    expect(await reviewProposal(ownerId, "some-other-project", id, "ACCEPTED")).toBe(false);
    expect(await db.proposal.findUnique({ where: { id } })).toMatchObject({ status: "PENDING" });
  });

  it("returns false for an unknown proposal", async () => {
    expect(await reviewProposal(ownerId, projectId, "does-not-exist", "ACCEPTED")).toBe(false);
  });
});