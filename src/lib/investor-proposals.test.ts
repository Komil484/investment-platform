import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { listInvestorProposals } from "@/server/proposals";

let ownerId: string;
let ianId: string;
let ivyId: string;
let firstProjectId: string;
let secondProjectId: string;

const user = (name: string, email: string, role: string) =>
  db.user.create({ data: { name, email, passwordHash: "x", role } });

const project = (name: string) =>
  db.project.create({
    data: {
      ownerId,
      status: "APPROVED",
      name,
      description: "A project used in tests.",
      category: "Technology",
      requiredAmount: 50000,
      expectedReturn: 12.5,
    },
  });

beforeEach(async () => {
  await db.user.deleteMany();
  ownerId = (await user("Omar Owner", "owner@example.com", "OWNER")).id;
  ianId = (await user("Ian Investor", "ian@example.com", "INVESTOR")).id;
  ivyId = (await user("Ivy Investor", "ivy@example.com", "INVESTOR")).id;
  firstProjectId = (await project("First project")).id;
  secondProjectId = (await project("Second project")).id;
});

describe("listInvestorProposals", () => {
  it("returns only the investor's own proposals, newest first, with the project", async () => {
    await db.proposal.create({
      data: {
        projectId: firstProjectId,
        investorId: ianId,
        amount: 10000,
        message: "Older offer.",
        status: "ACCEPTED",
        createdAt: new Date("2026-01-01"),
      },
    });
    await db.proposal.create({
      data: {
        projectId: secondProjectId,
        investorId: ianId,
        amount: 20000,
        message: "Newer offer.",
        createdAt: new Date("2026-02-01"),
      },
    });
    await db.proposal.create({
      data: { projectId: firstProjectId, investorId: ivyId, amount: 30000, message: "Someone else's offer." },
    });

    const list = await listInvestorProposals(ianId);

    expect(list.map((p) => p.amount)).toEqual([20000, 10000]);
    expect(list[0]).toMatchObject({
      status: "PENDING",
      project: { id: secondProjectId, name: "Second project", status: "APPROVED" },
    });
    expect(list[1]).toMatchObject({ status: "ACCEPTED" });
  });

  it("returns an empty list for an investor without proposals", async () => {
    expect(await listInvestorProposals(ianId)).toEqual([]);
  });
});