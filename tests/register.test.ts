import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { EmailTakenError, registerUser } from "@/server/users";

const valid = { name: "Ivy Investor", email: "Ivy@Example.com ", password: "password123", role: "INVESTOR" };

beforeEach(async () => {
  await db.user.deleteMany();
});

describe("registerSchema", () => {
  it("normalizes the email", () => {
    expect(registerSchema.parse(valid).email).toBe("ivy@example.com");
  });

  it.each([
    ["name", { name: "A" }],
    ["email", { email: "not-an-email" }],
    ["password", { password: "short" }],
    ["role", { role: "ADMIN" }],
  ])("rejects an invalid %s", (field, override) => {
    const result = registerSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors).toHaveProperty(field);
  });
});

describe("registerUser", () => {
  it("creates the user with a hashed password", async () => {
    const user = await registerUser(registerSchema.parse(valid));
    expect(user).toMatchObject({ name: "Ivy Investor", email: "ivy@example.com", role: "INVESTOR" });

    const stored = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.passwordHash).not.toBe("password123");
    expect(await bcrypt.compare("password123", stored.passwordHash)).toBe(true);
  });

  it("rejects a duplicate email", async () => {
    await registerUser(registerSchema.parse(valid));
    await expect(registerUser(registerSchema.parse({ ...valid, email: "ivy@example.com" }))).rejects.toThrow(
      EmailTakenError,
    );
  });
});
