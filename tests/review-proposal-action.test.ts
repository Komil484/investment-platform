import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

// The action reads the logged in user from a cookie, so the tests choose the user instead.
const currentUser = vi.hoisted(() => ({ value: null as null | { id: string; role: string; verified: boolean } }));
vi.mock("@/lib/session", () => ({ getCurrentUser: async () => currentUser.value }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
// redirect() normally throws a special Next.js error. Here it throws the URL so the test can check it.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const { reviewProposalAction } = await import("@/app/my-projects/[id]/proposals/actions");

let projectId: string;
let investorIds: string[];

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

async function proposal(investorId: string, amount: number, status = "PENDING") {
  return db.proposal.create({ data: { projectId, investorId, amount, status, message: "Happy to invest here." } });
}

beforeEach(async () => {
  await db.user.deleteMany();
  const owner = await db.user.create({
    data: { name: "Omar Owner", email: "owner@example.com", passwordHash: "x", role: "OWNER", verified: true },
  });
  currentUser.value = { id: owner.id, role: "OWNER", verified: true };
  investorIds = [];
  for (const n of [1, 2]) {
    const investor = await db.user.create({
      data: { name: `Investor ${n}`, email: `i${n}@example.com`, passwordHash: "x", role: "INVESTOR", verified: true },
    });
    investorIds.push(investor.id);
  }
  projectId = (
    await db.project.create({
      data: {
        ownerId: owner.id,
        status: "APPROVED",
        name: "Solar",
        description: "A project used in tests.",
        category: "Energy",
        requiredAmount: 50000,
        expectedReturn: 10,
      },
    })
  ).id;
});

describe("reviewProposalAction", () => {
  it("shows the overfunded notice instead of crashing", async () => {
    await proposal(investorIds[0], 40000, "ACCEPTED");
    const second = await proposal(investorIds[1], 20000);

    await expect(
      reviewProposalAction(form({ projectId, proposalId: second.id, decision: "ACCEPTED" })),
    ).rejects.toThrow(`REDIRECT:/my-projects/${projectId}/proposals?result=overfunded`);

    expect((await db.proposal.findUniqueOrThrow({ where: { id: second.id } })).status).toBe("PENDING");
  });

  it("still accepts a proposal that fits", async () => {
    const first = await proposal(investorIds[0], 30000);
    await expect(
      reviewProposalAction(form({ projectId, proposalId: first.id, decision: "ACCEPTED" })),
    ).rejects.toThrow(`REDIRECT:/my-projects/${projectId}/proposals?result=accepted`);
    expect((await db.proposal.findUniqueOrThrow({ where: { id: first.id } })).status).toBe("ACCEPTED");
  });

  it("can still reject a proposal that would overfund", async () => {
    await proposal(investorIds[0], 40000, "ACCEPTED");
    const second = await proposal(investorIds[1], 20000);
    await expect(
      reviewProposalAction(form({ projectId, proposalId: second.id, decision: "REJECTED" })),
    ).rejects.toThrow(`REDIRECT:/my-projects/${projectId}/proposals?result=rejected`);
  });
});
