import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getApprovedProject } from "@/server/projects";

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
