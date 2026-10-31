import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { listRemovedProjects, removeProject, restoreProject, suspendUser, unsuspendUser } from "@/server/admin";
import { authenticate } from "@/server/users";
import bcrypt from "bcryptjs";

let ownerId: string;
let adminId: string;

const project = (status: string) => ({
  ownerId,
  status,
  name: `${status} project`,
  description: "A project used in tests.",
  category: "Technology",
  requiredAmount: 50000,
  expectedReturn: 12.5,
});

beforeEach(async () => {
  await db.user.deleteMany();
  ownerId = (
    await db.user.create({
      data: {
        name: "Omar Owner",
        email: "owner@example.com",
        passwordHash: await bcrypt.hash("password123", 4),
        role: "OWNER",
        verified: true,
      },
    })
  ).id;
  adminId = (
    await db.user.create({ data: { name: "Alex Admin", email: "admin@example.com", passwordHash: "x", role: "ADMIN" } })
  ).id;
});

describe("unsuspendUser", () => {
  it("lets a suspended user log in again", async () => {
    await suspendUser(ownerId);
    expect(await authenticate({ email: "owner@example.com", password: "password123" })).toBeNull();

    expect(await unsuspendUser(ownerId)).toBe(true);
    expect(await authenticate({ email: "owner@example.com", password: "password123" })).not.toBeNull();
  });

  it("does nothing for a user who is not suspended, or for an admin", async () => {
    expect(await unsuspendUser(ownerId)).toBe(false);
    await db.user.update({ where: { id: adminId }, data: { suspended: true } });
    expect(await unsuspendUser(adminId)).toBe(false);
  });

  it("keeps the user's projects removed until an admin restores them", async () => {
    const { id } = await db.project.create({ data: project("APPROVED") });
    await suspendUser(ownerId);
    await unsuspendUser(ownerId);
    expect((await db.project.findUniqueOrThrow({ where: { id } })).status).toBe("REMOVED");
  });
});

describe("restoreProject", () => {
  it("puts a removed project back in the review queue as Pending", async () => {
    const { id } = await db.project.create({ data: project("APPROVED") });
    await removeProject(id);
    expect((await listRemovedProjects()).map((p) => p.id)).toEqual([id]);

    expect(await restoreProject(id)).toBe(true);
    expect((await db.project.findUniqueOrThrow({ where: { id } })).status).toBe("PENDING");
    expect(await listRemovedProjects()).toEqual([]);
  });

  it("only restores removed projects", async () => {
    const { id } = await db.project.create({ data: project("APPROVED") });
    expect(await restoreProject(id)).toBe(false);
    expect((await db.project.findUniqueOrThrow({ where: { id } })).status).toBe("APPROVED");
  });

  it("does not restore a project while its owner is suspended", async () => {
    const { id } = await db.project.create({ data: project("APPROVED") });
    await suspendUser(ownerId);
    expect(await restoreProject(id)).toBe(false);

    await unsuspendUser(ownerId);
    expect(await restoreProject(id)).toBe(true);
  });
});
