import { cookies } from "next/headers";
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

// The logged in user, or null. Looks the user up again so deleted accounts are logged out.
export async function getCurrentUser() {
  const userId = await verifySessionToken((await cookies()).get(COOKIE_NAME)?.value);
  if (!userId) return null;
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });
}
