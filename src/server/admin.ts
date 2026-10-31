import type { ReviewDecision } from "@/lib/constants";
import { db } from "@/lib/db";

// DEV-11 / FR-9 / US-09: the queue an administrator reviews. Oldest submissions come first.
export async function listPendingProjects() {
  return db.project.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      requiredAmount: true,
      expectedReturn: true,
      status: true,
      createdAt: true,
      owner: { select: { name: true, email: true } },
    },
  });
}

/**
 * Approve or reject a project. Only a project that is still PENDING can be reviewed,
 * so two admins clicking at the same time cannot overwrite each other's decision.
 * Returns true if the project was updated.
 */
export async function reviewPendingProject(projectId: string, decision: ReviewDecision) {
  const result = await db.project.updateMany({
    where: { id: projectId, status: "PENDING" },
    data: { status: decision },
  });
  return result.count === 1;
}