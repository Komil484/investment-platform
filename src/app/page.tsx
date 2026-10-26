import Link from "next/link";
import { ROLE_LABELS, type SignupRole } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="flex flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Investment Matching Platform</h1>
      {user ? (
        <>
          <p className="text-slate-600">
            You are logged in as <strong>{user.name}</strong> ({ROLE_LABELS[user.role as SignupRole] ?? user.role}).
          </p>
          <Link href="/projects" className="btn-primary">
            Browse projects
          </Link>
        </>
      ) : (
        <div className="flex gap-3">
          <Link href="/register" className="btn-primary">
            Create an account
          </Link>
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
          <Link href="/projects" className="btn-secondary">
            Browse projects
          </Link>
        </div>
      )}
    </main>
  );
}
