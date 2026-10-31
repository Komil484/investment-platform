import type { Metadata } from "next";
import { StatusBadge } from "@/components/StatusBadge";
import { ROLE_LABELS, type UserRole } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { listUsers } from "@/server/admin";
import { userAdminAction } from "./actions";

export const metadata: Metadata = { title: "Manage users" };

type Props = { searchParams: Promise<{ result?: string }> };

const NOTICES: Record<string, { ok: boolean; text: string }> = {
  verify: { ok: true, text: "User verified." },
  unverify: { ok: true, text: "User verification removed." },
  suspend: { ok: true, text: "User suspended. They can no longer log in and their projects were removed." },
  failed: { ok: false, text: "Nothing was changed. The user may already be suspended." },
  invalid: { ok: false, text: "That request was not valid. Please try again." },
};

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireRole("ADMIN");

  const { result } = await searchParams;
  const notice = result ? NOTICES[result] : undefined;
  const users = await listUsers();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Manage users</h1>
      <p className="mt-1 text-sm text-slate-600">
        {users.length === 1 ? "1 account" : `${users.length} accounts`}. Verify users you trust, or suspend suspicious
        ones.
      </p>

      {notice && (
        <p
          role="status"
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${notice.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
        >
          {notice.text}
        </p>
      )}

      {users.length === 0 ? (
        <p className="card mt-6 p-6 text-center text-slate-600">There are no users yet.</p>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">User</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Joined</th>
                <th scope="col" className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium break-words">{u.name}</div>
                    <div className="text-xs break-all text-slate-500">{u.email}</div>
                    <div className="text-xs text-slate-400">
                      {u._count.projects} projects · {u._count.proposals} proposals
                    </div>
                  </td>
                  <td className="px-4 py-3">{ROLE_LABELS[u.role as UserRole] ?? u.role}</td>
                  <td className="px-4 py-3">
                    {u.suspended ? (
                      <StatusBadge status="REMOVED" />
                    ) : u.verified ? (
                      <StatusBadge status="APPROVED" />
                    ) : (
                      <StatusBadge status="PENDING" />
                    )}
                    <div className="mt-1 text-xs text-slate-500">
                      {u.suspended ? "Suspended" : u.verified ? "Verified" : "Not verified"}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.suspended ? (
                      <span className="text-xs text-slate-400">No actions</span>
                    ) : (
                      <form action={userAdminAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="userId" value={u.id} />
                        {u.verified ? (
                          <button type="submit" name="action" value="unverify" className="btn-secondary">
                            Unverify
                          </button>
                        ) : (
                          <button type="submit" name="action" value="verify" className="btn-primary">
                            Verify
                          </button>
                        )}
                        <button type="submit" name="action" value="suspend" className="btn-secondary text-red-700">
                          Suspend
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}