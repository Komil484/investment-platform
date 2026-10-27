import { z } from "zod";
import { SIGNUP_ROLES } from "./constants";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
  role: z.enum(SIGNUP_ROLES, { error: "Choose Investor or Project Owner." }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  password: z.string().min(1, "Enter your password."),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Project update validation schema
export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Project name must be at least 3 characters.")
    .max(150, "Project name cannot exceed 150 characters."),

  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters.")
    .max(5000, "Description cannot exceed 5000 characters."),

  category: z
    .string()
    .trim()
    .min(2, "Category must be at least 2 characters.")
    .max(100, "Category cannot exceed 100 characters."),

  requiredAmount: z
    .number()
    .int("Required amount must be a whole number.")
    .min(1, "Required amount must be greater than zero."),

  expectedReturn: z
    .number()
    .finite("Expected return must be a valid number.")
    .min(0, "Expected return cannot be negative.")
    .max(100, "Expected return cannot exceed 100%."),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

