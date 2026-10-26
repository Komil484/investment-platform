import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-semibold">Log in</h1>
      <LoginForm />
    </main>
  );
}
