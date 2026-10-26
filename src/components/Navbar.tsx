import Link from "next/link";
import { logout } from "@/app/login/actions";
import { ROLE_LABELS, type SignupRole } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 text-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            Investment Matching Platform
          </Link>
          <Link href="/projects" className="text-slate-600 hover:text-slate-900">
            Projects
          </Link>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-slate-600">
              {user.name} · {ROLE_LABELS[user.role as SignupRole] ?? user.role}
            </span>
            <form action={logout}>
              <button type="submit" className="font-medium text-emerald-700 hover:underline">
                Log out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="font-medium text-emerald-700 hover:underline">
              Log in
            </Link>
            <Link href="/register" className="btn-primary">
              Sign up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
