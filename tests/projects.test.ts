import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { truncate } from "@/lib/format";
import { getApprovedProject, listApprovedProjects } from "@/server/projects";

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

beforeEach(async () => {
  await db.user.deleteMany();
  const owner = await db.user.create({
    data: { name: "Omar Owner", email: "owner@example.com", passwordHash: "x", role: "OWNER" },
  });
  ownerId = owner.id;
});

describe("getApprovedProject", () => {
  it("returns an approved project with its owner's name", async () => {
    const { id } = await db.project.create({ data: project(ownerId, "APPROVED") });
    expect(await getApprovedProject(id)).toMatchObject({
      id,
      name: "APPROVED project",
      requiredAmount: 50000,
      expectedReturn: 12.5,
      status: "APPROVED",
      owner: { name: "Omar Owner" },
    });
  });

  it.each(["PENDING", "REJECTED"])("hides a %s project", async (status) => {
    const { id } = await db.project.create({ data: project(ownerId, status) });
    expect(await getApprovedProject(id)).toBeNull();
  });

  it("returns null for an unknown id", async () => {
    expect(await getApprovedProject("does-not-exist")).toBeNull();
  });
});

describe("listApprovedProjects", () => {
  it("only lists approved projects, newest first", async () => {
    const older = await db.project.create({
      data: { ...project(ownerId, "APPROVED"), name: "Older", createdAt: new Date("2026-01-01") },
    });
    const newer = await db.project.create({
      data: { ...project(ownerId, "APPROVED"), name: "Newer", createdAt: new Date("2026-02-01") },
    });
    await db.project.create({ data: project(ownerId, "PENDING") });
    await db.project.create({ data: project(ownerId, "REJECTED") });

    const list = await listApprovedProjects();
    expect(list.map((p) => p.id)).toEqual([newer.id, older.id]);
  });

  it("has every field the list shows", async () => {
    await db.project.create({ data: project(ownerId, "APPROVED") });
    const [item] = await listApprovedProjects();
    expect(Object.keys(item).sort()).toEqual(
      ["category", "description", "expectedReturn", "id", "name", "requiredAmount", "status"],
    );
  });

  it("returns an empty list when nothing is approved", async () => {
    await db.project.create({ data: project(ownerId, "PENDING") });
    expect(await listApprovedProjects()).toEqual([]);
  });
});

describe("truncate", () => {
  it("leaves short text alone", () => {
    expect(truncate("Short text", 20)).toBe("Short text");
  });

  it("cuts long text at a space and adds an ellipsis", () => {
    expect(truncate("one two three four five", 12)).toBe("one two…");
  });
});
