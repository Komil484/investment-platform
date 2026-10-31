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

// DEV-17: approved projects an admin can take down.
export async function listApprovedProjectsForAdmin() {
  return db.project.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      requiredAmount: true,
      createdAt: true,
      owner: { select: { name: true, email: true } },
      _count: { select: { proposals: true } },
    },
  });
}

// Soft delete: the project and its proposals stay in the database but disappear from the site.
export async function removeProject(projectId: string) {
  const result = await db.project.updateMany({
    where: { id: projectId, status: { not: "REMOVED" } },
    data: { status: "REMOVED" },
  });
  return result.count === 1;
}

// DEV-15: every non-admin account, newest first. Admins are left out so they cannot be changed here.
export async function listUsers() {
  return db.user.findMany({
    where: { role: { not: "ADMIN" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      verified: true,
      suspended: true,
      createdAt: true,
      _count: { select: { projects: true, proposals: true } },
    },
  });
}

// Verify or un-verify a non-admin user. Returns true if a user was updated.
export async function setUserVerified(userId: string, verified: boolean) {
  const result = await db.user.updateMany({
    where: { id: userId, role: { not: "ADMIN" }, suspended: false },
    data: { verified },
  });
  return result.count === 1;
}

/**
 * DEV-17: suspend a non-admin user. They can no longer log in, and all of their
 * projects are marked REMOVED so investors stop seeing them. Nothing is deleted.
 * Returns true if the user was suspended.
 */
export async function suspendUser(userId: string) {
  return db.$transaction(async (tx) => {
    const result = await tx.user.updateMany({
      where: { id: userId, role: { not: "ADMIN" }, suspended: false },
      data: { suspended: true },
    });
    if (result.count !== 1) return false;

    await tx.project.updateMany({
      where: { ownerId: userId },
      data: { status: "REMOVED" },
    });
    return true;
  });
}

// DEV-45: let a suspended user log in again. Their projects stay removed; restore them one by one if they are fine.
export async function unsuspendUser(userId: string) {
  const result = await db.user.updateMany({
    where: { id: userId, role: { not: "ADMIN" }, suspended: true },
    data: { suspended: false },
  });
  return result.count === 1;
}

// DEV-45: removed projects, so an admin can bring one back.
export async function listRemovedProjects() {
  return db.project.findMany({
    where: { status: "REMOVED" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      requiredAmount: true,
      updatedAt: true,
      owner: { select: { name: true, email: true, suspended: true } },
    },
  });
}

/**
 * DEV-45: bring back a removed project. It goes back to PENDING, so an admin reviews it again
 * before investors can see it. A project of a suspended owner stays removed.
 * Returns true if the project was restored.
 */
export async function restoreProject(projectId: string) {
  const result = await db.project.updateMany({
    where: { id: projectId, status: "REMOVED", owner: { suspended: false } },
    data: { status: "PENDING" },
  });
  return result.count === 1;
}
