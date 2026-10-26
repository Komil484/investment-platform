import type { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-semibold">Create your account</h1>
      <RegisterForm />
    </main>
  );
}
