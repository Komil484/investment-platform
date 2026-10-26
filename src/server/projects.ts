import { db } from "@/lib/db";

// US-03 / FR-4: only approved projects are visible to investors.
export async function getApprovedProject(id: string) {
  return db.project.findFirst({
    where: { id, status: "APPROVED" },
    include: { owner: { select: { name: true } } },
  });
}

// US-02 / FR-3: the list investors browse. Newest projects come first.
export async function listApprovedProjects() {
  return db.project.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      requiredAmount: true,
      expectedReturn: true,
      status: true,
    },
  });
}
