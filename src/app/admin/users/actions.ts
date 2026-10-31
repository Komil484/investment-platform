"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { setUserVerified, suspendUser } from "@/server/admin";

const ACTIONS = ["verify", "unverify", "suspend"] as const;
type UserAction = (typeof ACTIONS)[number];

function isUserAction(value: unknown): value is UserAction {
  return ACTIONS.some((action) => action === value);
}

export async function userAdminAction(formData: FormData) {
  // Checked again here: hiding the page is not enough, anyone can send a request to this action.
  await requireRole("ADMIN");

  const userId = formData.get("userId");
  const action = formData.get("action");
  if (typeof userId !== "string" || !userId || !isUserAction(action)) {
    redirect("/admin/users?result=invalid");
  }

  let updated = false;
  if (action === "verify") updated = await setUserVerified(userId, true);
  if (action === "unverify") updated = await setUserVerified(userId, false);
  if (action === "suspend") updated = await suspendUser(userId);

  revalidatePath("/admin/users");
  revalidatePath("/projects");
  revalidatePath("/admin/projects");

  redirect(`/admin/users?result=${updated ? action : "failed"}`);
}