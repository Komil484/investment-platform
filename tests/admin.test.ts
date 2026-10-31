import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { listPendingProjects, reviewPendingProject } from "@/server/admin";

const project = (ownerId: string, status: string, extra: Record<string, unknown> = {}) => ({
  ownerId,
  status,
  name: `${status} project`,
  description: "A project used in tests.",
  category: "Technology",
  requiredAmount: 50000,
  expectedReturn: 12.5,
  ...extra,
});

let ownerId: string;

beforeEach(async () => {
  await db.user.deleteMany();
  const owner = await db.user.create({
    data: { name: "Omar Owner", email: "owner@example.com", passwordHash: "x", role: "OWNER" },
  });
  ownerId = owner.id;
});

describe("listPendingProjects", () => {
  it("lists only pending projects, oldest first, with the owner", async () => {
    const older = await db.project.create({
      data: project(ownerId, "PENDING", { name: "Older", createdAt: new Date("2026-01-01") }),
    });
    const newer = await db.project.create({
      data: project(ownerId, "PENDING", { name: "Newer", createdAt: new Date("2026-02-01") }),
    });
    await db.project.create({ data: project(ownerId, "APPROVED") });
    await db.project.create({ data: project(ownerId, "REJECTED") });

    const list = await listPendingProjects();
    expect(list.map((p) => p.id)).toEqual([older.id, newer.id]);
    expect(list[0].owner).toEqual({ name: "Omar Owner", email: "owner@example.com" });
  });

  it("returns an empty list when nothing is pending", async () => {
    await db.project.create({ data: project(ownerId, "APPROVED") });
    expect(await listPendingProjects()).toEqual([]);
  });
});

describe("reviewPendingProject", () => {
  it.each(["APPROVED", "REJECTED"] as const)("sets a pending project to %s", async (decision) => {
    const { id } = await db.project.create({ data: project(ownerId, "PENDING") });

    expect(await reviewPendingProject(id, decision)).toBe(true);
    expect(await db.project.findUnique({ where: { id } })).toMatchObject({ status: decision });
  });

  it.each(["APPROVED", "REJECTED"])("does not change a project that is already %s", async (status) => {
    const { id } = await db.project.create({ data: project(ownerId, status) });

    expect(await reviewPendingProject(id, status === "APPROVED" ? "REJECTED" : "APPROVED")).toBe(false);
    expect(await db.project.findUnique({ where: { id } })).toMatchObject({ status });
  });

  it("returns false for an unknown id", async () => {
    expect(await reviewPendingProject("does-not-exist", "APPROVED")).toBe(false);
  });
});