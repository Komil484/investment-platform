import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

// The actions read the logged in user from a cookie, so the tests choose the user instead.
const currentUser = vi.hoisted(() => ({ value: null as null | { id: string; role: string; verified: boolean } }));
vi.mock("@/lib/session", () => ({ getCurrentUser: async () => currentUser.value }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
// redirect() normally throws a special Next.js error. Here it throws the URL so the test can check it.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const { submitProposalAction } = await import("@/app/projects/[id]/actions");
const { createProjectAction } = await import("@/app/projects/new/actions");

const idle = { status: "idle" } as const;
let ownerId: string;
let investorId: string;
let projectId: string;

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const projectForm = () =>
  form({
    name: "Bakery",
    description: "A small bakery in the city centre.",
    category: "Food",
    requiredAmount: "20000",
    expectedReturn: "8",
  });

const proposalForm = () => form({ projectId, amount: "1000", message: "I would like to invest." });

beforeEach(async () => {
  await db.user.deleteMany();
  ownerId = (
    await db.user.create({ data: { name: "Omar Owner", email: "owner@example.com", passwordHash: "x", role: "OWNER" } })
  ).id;
  investorId = (
    await db.user.create({
      data: { name: "Ian Investor", email: "investor@example.com", passwordHash: "x", role: "INVESTOR" },
    })
  ).id;
  projectId = (
    await db.project.create({
      data: {
        ownerId,
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

describe("unverified users", () => {
  it("cannot create a project", async () => {
    currentUser.value = { id: ownerId, role: "OWNER", verified: false };
    const state = await createProjectAction(idle, projectForm());
    expect(state).toMatchObject({ status: "error", message: expect.stringContaining("verified") });
    expect(await db.project.count({ where: { ownerId, name: "Bakery" } })).toBe(0);
  });

  it("cannot send a proposal", async () => {
    currentUser.value = { id: investorId, role: "INVESTOR", verified: false };
    const state = await submitProposalAction(idle, proposalForm());
    expect(state).toMatchObject({ status: "error", message: expect.stringContaining("verified") });
    expect(await db.proposal.count()).toBe(0);
  });
});

describe("verified users", () => {
  it("can create a project", async () => {
    currentUser.value = { id: ownerId, role: "OWNER", verified: true };
    await expect(createProjectAction(idle, projectForm())).rejects.toThrow("REDIRECT:/my-projects");
    expect(await db.project.count({ where: { ownerId, name: "Bakery", status: "PENDING" } })).toBe(1);
  });

  it("can send a proposal", async () => {
    currentUser.value = { id: investorId, role: "INVESTOR", verified: true };
    expect(await submitProposalAction(idle, proposalForm())).toEqual({ status: "success" });
    expect(await db.proposal.count()).toBe(1);
  });
});
