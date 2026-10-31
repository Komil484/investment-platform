import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "./constants";
import { db } from "./db";
import { SESSION_MAX_AGE, signSessionToken, verifySessionToken } from "./session-token";

const COOKIE_NAME = "session";

export async function createSession(userId: string) {
  (await cookies()).set(COOKIE_NAME, await signSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE_NAME);
}

// The logged in user, or null. Looks the user up again so deleted or suspended accounts are logged out.
export async function getCurrentUser() {
  const userId = await verifySessionToken((await cookies()).get(COOKIE_NAME)?.value);
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, verified: true, suspended: true },
  });
  if (!user || user.suspended) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role, verified: user.verified };
}

// One place for "must be logged in as one of these roles". Use it in every page and action.
export async function requireRole(...roles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role as UserRole)) redirect("/projects");
  return user;
}