import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

// The action reads the logged in user from a cookie, so the tests choose the user instead.
const currentUser = vi.hoisted(() => ({ value: null as null | { id: string; role: string; verified: boolean } }));
vi.mock("@/lib/session", () => ({ getCurrentUser: async () => currentUser.value }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { submitProposalAction } = await import("@/app/projects/[id]/actions");

const idle = { status: "idle" } as const;
let projectId: string;

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(async () => {
  await db.user.deleteMany();
  const owner = await db.user.create({
    data: { name: "Omar Owner", email: "owner@example.com", passwordHash: "x", role: "OWNER", verified: true },
  });
  const investor = await db.user.create({
    data: { name: "Ian Investor", email: "investor@example.com", passwordHash: "x", role: "INVESTOR", verified: true },
  });
  currentUser.value = { id: investor.id, role: "INVESTOR", verified: true };
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

describe("submitProposalAction", () => {
  it("shows a message instead of crashing when the amount is more than the project needs", async () => {
    const message = "I would like to fund all of it.";
    const state = await submitProposalAction(idle, form({ projectId, amount: "60000", message }));

    expect(state).toMatchObject({
      status: "error",
      message: "A proposal cannot be more than the amount the project needs ($50,000).",
      fieldErrors: { amount: ["A proposal cannot be more than the amount the project needs ($50,000)."] },
      values: { amount: "60000", message },
    });
    expect(await db.proposal.count()).toBe(0);
  });

  it("keeps what the investor typed when a field is invalid", async () => {
    const state = await submitProposalAction(idle, form({ projectId, amount: "1000", message: "short" }));
    expect(state).toMatchObject({ status: "error", values: { amount: "1000", message: "short" } });
  });

  it("still accepts an amount equal to what the project needs", async () => {
    const state = await submitProposalAction(
      idle,
      form({ projectId, amount: "50000", message: "I would like to fund all of it." }),
    );
    expect(state).toEqual({ status: "success" });
    expect(await db.proposal.count()).toBe(1);
  });
});
