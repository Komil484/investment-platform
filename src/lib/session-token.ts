import { jwtVerify, SignJWT } from "jose";

// How long a login lasts before the user has to log in again.
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set. Copy .env.example to .env.");
  return new TextEncoder().encode(secret);
}

// The cookie only stores the user id, signed so it can't be changed by hand.
export async function signSessionToken(userId: string) {
  return new SignJWT()
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

// Returns the user id, or null if the token is missing, expired or fake.
export async function verifySessionToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
