import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createProjectSchema } from "@/lib/validation";
import { createProject, getEditableProject, listApprovedProjects, listOwnerProjects } from "@/server/projects";

const input = {
  name: "Solar Panels for Schools",
  description: "We install solar panels on school roofs to cut their electricity bills.",
  category: "Energy",
  requiredAmount: 80000,
  expectedReturn: 11.5,
};

let ownerId: string;

beforeEach(async () => {
  await db.user.deleteMany();
  ownerId = (
    await db.user.create({
      data: { name: "Omar Owner", email: "owner@example.com", passwordHash: "x", role: "OWNER" },
    })
  ).id;
});

describe("createProject", () => {
  it("creates a pending project owned by the owner", async () => {
    const { id } = await createProject(ownerId, input);

    expect(await db.project.findUnique({ where: { id } })).toMatchObject({ ...input, ownerId, status: "PENDING" });
  });

  it("keeps the new project out of the public list until it is approved", async () => {
    await createProject(ownerId, input);

    expect(await listApprovedProjects()).toEqual([]);
  });

  it("shows the new project to its owner, who can still edit it", async () => {
    const { id } = await createProject(ownerId, input);

    expect((await listOwnerProjects(ownerId)).map((p) => p.id)).toEqual([id]);
    expect(await getEditableProject(id, ownerId)).toMatchObject({ id, status: "PENDING" });
  });
});

describe("createProjectSchema", () => {
  it("accepts valid input", () => {
    expect(createProjectSchema.safeParse(input).success).toBe(true);
  });

  it.each([
    ["a short name", { name: "ab" }],
    ["a short description", { description: "Too short." }],
    ["a missing category", { category: "" }],
    ["a zero amount", { requiredAmount: 0 }],
    ["a fractional amount", { requiredAmount: 1000.5 }],
    ["a negative return", { expectedReturn: -1 }],
    ["a return above 100", { expectedReturn: 101 }],
    ["an empty amount (NaN)", { requiredAmount: NaN }],
  ])("rejects %s", (_label, override) => {
    expect(createProjectSchema.safeParse({ ...input, ...override }).success).toBe(false);
  });
});