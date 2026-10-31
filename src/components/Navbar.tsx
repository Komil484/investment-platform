import Link from "next/link";
import { logout } from "@/app/login/actions";
import { ROLE_LABELS, type UserRole } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

const linkClass = "text-slate-600 hover:text-slate-900";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/" className="font-semibold">
            Investment Matching Platform
          </Link>
          <Link href="/projects" className={linkClass}>
            Projects
          </Link>
          {user?.role === "OWNER" && (
            <Link href="/my-projects" className={linkClass}>
              My Projects
            </Link>
          )}
          {user?.role === "INVESTOR" && (
            <Link href="/my-proposals" className={linkClass}>
              My Proposals
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <>
              <Link href="/admin/projects" className={linkClass}>
                Review Projects
              </Link>
              <Link href="/admin/users" className={linkClass}>
                Manage Users
              </Link>
            </>
          )}
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-slate-600">
              {user.name} · {ROLE_LABELS[user.role as UserRole] ?? user.role}
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