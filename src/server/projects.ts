import { db } from "@/lib/db";

import type { CreateProjectInput,UpdateProjectInput } from "@/lib/validation";

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

/**
 * List projects belonging to a specific owner.
 * Includes pending, approved, and rejected projects.
 */
export async function listOwnerProjects(ownerId: string) {
  return db.project.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      requiredAmount: true,
      expectedReturn: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { proposals: true } },
    },
  });
}

/**
 * Retrieve a project for editing.
 * Only the owner of a pending project can retrieve it.
 */
export async function getEditableProject(
  projectId: string,
  ownerId: string,
) {
  return db.project.findFirst({
    where: {
      id: projectId,
      ownerId,
      status: "PENDING",
    },
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

/**
 * Update details only when the project still belongs to
 * the specified owner and remains pending.
 */
export async function updatePendingProject(
  projectId: string,
  ownerId: string,
  input: UpdateProjectInput,
) {
  const result = await db.project.updateMany({
    where: {
      id: projectId,
      ownerId,
      status: "PENDING",
    },
    data: {
      name: input.name,
      description: input.description,
      category: input.category,
      requiredAmount: input.requiredAmount,
      expectedReturn: input.expectedReturn,
    },
  });

  return result.count === 1;
}


// US-05 / FR-5: an owner creates a project. It starts as PENDING until an administrator reviews it.
export async function createProject(ownerId: string, input: CreateProjectInput) {
  return db.project.create({
    data: {
      ownerId,
      status: "PENDING",
      name: input.name,
      description: input.description,
      category: input.category,
      requiredAmount: input.requiredAmount,
      expectedReturn: input.expectedReturn,
    },
    select: { id: true },
  });
}