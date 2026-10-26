/** Roles a visitor may pick when registering. */
export const SIGNUP_ROLES = ["INVESTOR", "OWNER"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const ROLE_LABELS: Record<SignupRole, string> = {
  INVESTOR: "Investor",
  OWNER: "Project Owner",
};

export const PROJECT_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
