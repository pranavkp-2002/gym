import { z } from "zod";

const email = z.email("Enter a valid email").trim().toLowerCase().max(254);
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters"); // bcrypt's input limit

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(72),
});

export const updateProfileSchema = z
  .object({ name: z.string().trim().min(1).max(80).optional(), email: email.optional() })
  .refine((v) => v.name !== undefined || v.email !== undefined, "Nothing to update");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(72),
  newPassword: password,
});
