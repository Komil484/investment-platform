import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getOwnerProjectProposals } from "@/server/proposals";

let ownerId: string;
let otherOwnerId: string;
let ianId: string;
let ivyId: string;
let projectId: string;

const user = (name: string, email: string, role: string) =>
  db.user.create({ data: { name, email, passwordHash: "x", role } });

beforeEach(async () => {
  await db.user.deleteMany();
  ownerId = (await user("Omar Owner", "owner@example.com", "OWNER")).id;
  otherOwnerId = (await user("Other Owner", "other-owner@example.com", "OWNER")).id;
  ianId = (await user("Ian Investor", "ian@example.com", "INVESTOR")).id;
  ivyId = (await user("Ivy Investor", "ivy@example.com", "INVESTOR")).id;
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

describe("getOwnerProjectProposals", () => {
  it("returns the proposals for the owner's project, newest first, with the investor", async () => {
    await db.proposal.create({
      data: { projectId, investorId: ianId, amount: 10000, message: "First offer.", createdAt: new Date("2026-01-01") },
    });
    await db.proposal.create({
      data: { projectId, investorId: ivyId, amount: 20000, message: "Second offer.", createdAt: new Date("2026-02-01") },
    });

    const result = await getOwnerProjectProposals(projectId, ownerId);

    expect(result).toMatchObject({ id: projectId, name: "Approved project", requiredAmount: 50000 });
    expect(result?.proposals.map((p) => p.amount)).toEqual([20000, 10000]);
    expect(result?.proposals[0]).toMatchObject({
      status: "PENDING",
      investor: { name: "Ivy Investor", email: "ivy@example.com" },
    });
  });

  it("returns an empty list for a project without proposals", async () => {
    expect(await getOwnerProjectProposals(projectId, ownerId)).toMatchObject({ proposals: [] });
  });

  it("returns null for another owner's project", async () => {
    await db.proposal.create({ data: { projectId, investorId: ianId, amount: 10000, message: "An offer." } });
    expect(await getOwnerProjectProposals(projectId, otherOwnerId)).toBeNull();
  });

  it("returns null for an unknown project", async () => {
    expect(await getOwnerProjectProposals("does-not-exist", ownerId)).toBeNull();
  });
});