import { db } from "@/lib/db";

// US-03 / FR-4: only approved projects are visible to investors.
export async function getApprovedProject(id: string) {
  return db.project.findFirst({
    where: { id, status: "APPROVED" },
    include: { owner: { select: { name: true } } },
  });
}
