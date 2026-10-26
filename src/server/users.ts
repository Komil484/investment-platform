import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { RegisterInput } from "@/lib/validation";

export class EmailTakenError extends Error {
  constructor() {
    super("An account with this email already exists.");
  }
}

// US-01 / FR-1
export async function registerUser(data: RegisterInput) {
  try {
    return await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash: await bcrypt.hash(data.password, 10),
      },
      select: { id: true, name: true, email: true, role: true },
    });
  } catch (err) {
    // Unique constraint on email; checked here instead of a prior lookup to avoid a race.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new EmailTakenError();
    }
    throw err;
  }
}
