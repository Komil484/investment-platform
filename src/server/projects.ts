import { db } from "@/lib/db";

import type { CreateProjectInput,UpdateProjectInput } from "@/lib/validation";

// US-03 / FR-4: only approved projects are visible to investors.
export async function getApprovedProject(id: string) {
  return db.project.findFirst({
    where: { id, status: "APPROVED" },
    include: { owner: { select: { name: true } } },
  });
}

export type ProjectFilters = {
  q?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  minReturn?: number;
};

// US-02 / FR-3: the list investors browse, optionally filtered. Newest projects come first.
export async function listApprovedProjects(filters: ProjectFilters = {}) {
  const { q, category, minAmount, maxAmount, minReturn } = filters;
  return db.project.findMany({
    where: {
      status: "APPROVED",
      ...(q ? { OR: [{ name: { contains: q } }, { description: { contains: q } }] } : {}),
      ...(category ? { category } : {}),
      requiredAmount: { gte: minAmount, lte: maxAmount },
      expectedReturn: { gte: minReturn },
    },
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

// The categories that appear in the filter drop-down.
export async function listApprovedCategories() {
  const rows = await db.project.findMany({
    where: { status: "APPROVED" },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
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