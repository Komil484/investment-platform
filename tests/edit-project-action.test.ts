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

const { updateProjectAction } = await import("@/app/projects/[id]/edit/actions");

const idle = { status: "idle" } as const;
let projectId: string;

const fields = {
  name: "Better bakery",
  description: "A small bakery in the city centre, now with coffee.",
  category: "Food",
  requiredAmount: "25000",
  expectedReturn: "9",
};

function form(overrides: Partial<typeof fields> = {}) {
  const data = new FormData();
  data.set("projectId", projectId);
  for (const [key, value] of Object.entries({ ...fields, ...overrides })) data.set(key, value);
  return data;
}

beforeEach(async () => {
  await db.user.deleteMany();
  const owner = await db.user.create({
    data: { name: "Omar Owner", email: "owner@example.com", passwordHash: "x", role: "OWNER", verified: true },
  });
  currentUser.value = { id: owner.id, role: "OWNER", verified: true };
  projectId = (
    await db.project.create({
      data: {
        ownerId: owner.id,
        status: "PENDING",
        name: "Bakery",
        description: "A small bakery in the city centre.",
        category: "Food",
        requiredAmount: 20000,
        expectedReturn: 8,
      },
    })
  ).id;
});

describe("updateProjectAction", () => {
  it("shows an error under the wrong field and keeps everything the owner typed", async () => {
    const state = await updateProjectAction(idle, form({ description: "Too short", requiredAmount: "0" }));

    expect(state).toMatchObject({
      status: "error",
      fieldErrors: {
        description: ["Description must be at least 20 characters."],
        requiredAmount: ["Required amount must be greater than zero."],
      },
      values: { ...fields, description: "Too short", requiredAmount: "0" },
    });
    expect((await db.project.findUniqueOrThrow({ where: { id: projectId } })).name).toBe("Bakery");
  });

  it("explains when the project can no longer be edited, and keeps the input", async () => {
    await db.project.update({ where: { id: projectId }, data: { status: "APPROVED" } });
    const state = await updateProjectAction(idle, form());
    expect(state).toMatchObject({
      status: "error",
      message: expect.stringContaining("can no longer be edited"),
      values: fields,
    });
  });

  it("saves valid changes and goes back to My Projects", async () => {
    await expect(updateProjectAction(idle, form())).rejects.toThrow("REDIRECT:/my-projects?updated=1");
    expect(await db.project.findUniqueOrThrow({ where: { id: projectId } })).toMatchObject({
      name: "Better bakery",
      requiredAmount: 25000,
      expectedReturn: 9,
      status: "PENDING",
    });
  });
});
