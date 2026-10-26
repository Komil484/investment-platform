"use server";

import { registerSchema } from "@/lib/validation";
import { EmailTakenError, registerUser } from "@/server/users";

export type RegisterState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[] | undefined> }
  | { status: "success"; name: string };

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await registerUser(parsed.data);
    return { status: "success", name: user.name };
  } catch (err) {
    if (err instanceof EmailTakenError) return { status: "error", message: err.message };
    throw err;
  }
}
