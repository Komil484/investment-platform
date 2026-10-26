"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";
import { authenticate } from "@/server/users";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter your email and password." };

  const user = await authenticate(parsed.data);
  // Same message for a wrong email or a wrong password, so nobody can check which emails exist.
  if (!user) return { error: "Wrong email or password." };

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
