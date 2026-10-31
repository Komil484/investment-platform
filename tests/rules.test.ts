import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { listApprovedProjects } from "@/server/projects";
import { removeProject, setUserVerified, suspendUser } from "@/server/admin";
import {
  ProposalAmountError,
  ProposalOverfundedError,
  reviewProposal,
  submitProposal,
} from "@/server/proposals";

const user = (name: string, email: string, role: string) =>
  db.user.create({ data: { name, email, passwordHash: "x", role } });

const project = (ownerId: string, status = "APPROVED", extra: Record<string, unknown> = {}) =>
  db.project.create({
    data: {
      ownerId,
      status,
      name: "A project",
      description: "A project used in tests.",
      category: "Technology",
      requiredAmount: 50000,
      expectedReturn: 12.5,
      ...extra,
    },
  });

const message = "I would like to invest in this.";

let ownerId: string;
let adminId: string;
let ianId: string;
let ivyId: string;

beforeEach(async () => {
  await db.user.deleteMany();
  ownerId = (await user("Omar Owner", "owner@example.com", "OWNER")).id;
  adminId = (await user("Alex Admin", "admin@example.com", "ADMIN")).id;
  ianId = (await user("Ian Investor", "ian@example.com", "INVESTOR")).id;
  ivyId = (await user("Ivy Investor", "ivy@example.com", "INVESTOR")).id;
});

describe("verify and suspend users", () => {
  it("verifies and un-verifies a user but never an admin", async () => {
    expect(await setUserVerified(ianId, true)).toBe(true);
    expect(await db.user.findUnique({ where: { id: ianId } })).toMatchObject({ verified: true });
    expect(await setUserVerified(ianId, false)).toBe(true);
    expect(await setUserVerified(adminId, true)).toBe(false);
  });

  it("suspends a user and removes their projects", async () => {
    const { id } = await project(ownerId);

    expect(await suspendUser(ownerId)).toBe(true);
    expect(await db.user.findUnique({ where: { id: ownerId } })).toMatchObject({ suspended: true });
    expect(await db.project.findUnique({ where: { id } })).toMatchObject({ status: "REMOVED" });
    expect(await suspendUser(ownerId)).toBe(false);
  });

  it("never suspends an admin", async () => {
    expect(await suspendUser(adminId)).toBe(false);
  });
});

describe("removeProject", () => {
  it("hides the project from the public list, once", async () => {
    const { id } = await project(ownerId);

    expect(await removeProject(id)).toBe(true);
    expect(await listApprovedProjects()).toEqual([]);
    expect(await removeProject(id)).toBe(false);
  });
});

describe("proposal rules", () => {
  it("rejects a proposal above the required amount but allows the exact amount", async () => {
    const { id } = await project(ownerId);

    await expect(submitProposal(ianId, id, { amount: 50001, message })).rejects.toBeInstanceOf(ProposalAmountError);
    await expect(submitProposal(ianId, id, { amount: 50000, message })).resolves.toBeDefined();
  });

  it("does not accept proposals that together exceed the required amount", async () => {
    const { id: projectId } = await project(ownerId);
    const a = await submitProposal(ianId, projectId, { amount: 30000, message });
    const b = await submitProposal(ivyId, projectId, { amount: 30000, message });

    expect(await reviewProposal(ownerId, projectId, a.id, "ACCEPTED")).toBe(true);
    await expect(reviewProposal(ownerId, projectId, b.id, "ACCEPTED")).rejects.toBeInstanceOf(ProposalOverfundedError);
    expect(await db.proposal.findUnique({ where: { id: b.id } })).toMatchObject({ status: "PENDING" });
    expect(await reviewProposal(ownerId, projectId, b.id, "REJECTED")).toBe(true);
  });

  it("does not review a proposal on a project that is no longer approved", async () => {
    const { id: projectId } = await project(ownerId);
    const a = await submitProposal(ianId, projectId, { amount: 1000, message });
    await removeProject(projectId);

    expect(await reviewProposal(ownerId, projectId, a.id, "ACCEPTED")).toBe(false);
  });
});

describe("listApprovedProjects filters", () => {
  it("filters by text, category, amount and return", async () => {
    await project(ownerId, "APPROVED", { name: "Solar farm", category: "Energy", requiredAmount: 100000, expectedReturn: 15 });
    await project(ownerId, "APPROVED", { name: "Bakery app", category: "Food", requiredAmount: 20000, expectedReturn: 8 });

    expect((await listApprovedProjects({ q: "solar" })).map((p) => p.name)).toEqual(["Solar farm"]);
    expect((await listApprovedProjects({ category: "Food" })).map((p) => p.name)).toEqual(["Bakery app"]);
    expect((await listApprovedProjects({ minAmount: 50000 })).map((p) => p.name)).toEqual(["Solar farm"]);
    expect((await listApprovedProjects({ maxAmount: 50000 })).map((p) => p.name)).toEqual(["Bakery app"]);
    expect((await listApprovedProjects({ minReturn: 10 })).map((p) => p.name)).toEqual(["Solar farm"]);
    expect(await listApprovedProjects({ q: "nothing-matches" })).toEqual([]);
  });
});