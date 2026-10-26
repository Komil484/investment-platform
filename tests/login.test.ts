import { SignJWT } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { signSessionToken, verifySessionToken } from "@/lib/session-token";
import { loginSchema, registerSchema } from "@/lib/validation";
import { authenticate, registerUser } from "@/server/users";

const login = (email: string, password: string) => authenticate(loginSchema.parse({ email, password }));

beforeAll(async () => {
  await db.user.deleteMany();
  await registerUser(
    registerSchema.parse({ name: "Ivy Investor", email: "ivy@example.com", password: "password123", role: "INVESTOR" }),
  );
});

describe("authenticate", () => {
  it("logs in with the right email and password", async () => {
    expect(await login("ivy@example.com", "password123")).toMatchObject({
      name: "Ivy Investor",
      email: "ivy@example.com",
      role: "INVESTOR",
    });
  });

  it("ignores upper case and spaces in the email", async () => {
    expect(await login("  IVY@example.com ", "password123")).not.toBeNull();
  });

  it("does not return the password hash", async () => {
    expect(await login("ivy@example.com", "password123")).not.toHaveProperty("passwordHash");
  });

  it("rejects a wrong password", async () => {
    expect(await login("ivy@example.com", "wrong-password")).toBeNull();
  });

  it("rejects an unknown email", async () => {
    expect(await login("nobody@example.com", "password123")).toBeNull();
  });
});

describe("session token", () => {
  it("gives back the user id it was made with", async () => {
    expect(await verifySessionToken(await signSessionToken("user-1"))).toBe("user-1");
  });

  it("rejects a missing or changed token", async () => {
    const token = await signSessionToken("user-1");
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken(token.slice(0, -2) + "xx")).toBeNull();
  });

  it("rejects a token signed with another secret", async () => {
    const fake = await new SignJWT()
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-1")
      .sign(new TextEncoder().encode("some-other-secret"));
    expect(await verifySessionToken(fake)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const expired = await new SignJWT()
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-1")
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode("test-secret"));
    expect(await verifySessionToken(expired)).toBeNull();
  });
});
