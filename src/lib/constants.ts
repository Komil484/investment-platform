/** Roles a visitor may pick when registering. */
export const SIGNUP_ROLES = ["INVESTOR", "OWNER"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

/** Every role a user can have. ADMIN accounts are never created through registration. */
export const USER_ROLES = [...SIGNUP_ROLES, "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  INVESTOR: "Investor",
  OWNER: "Project Owner",
  ADMIN: "Administrator",
};

export const PROJECT_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** The statuses an administrator can give a pending project. `satisfies` fails to compile if one is not a real status. */
export const REVIEW_DECISIONS = ["APPROVED", "REJECTED"] as const satisfies readonly ProjectStatus[];
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

export const PROPOSAL_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

/** The statuses a project owner can give a pending proposal. */
export const PROPOSAL_DECISIONS = ["ACCEPTED", "REJECTED"] as const satisfies readonly ProposalStatus[];
export type ProposalDecision = (typeof PROPOSAL_DECISIONS)[number];