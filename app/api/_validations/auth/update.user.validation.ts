/**
 * Validation schemas for user updates
 */

import { z } from "zod";

/**
 * Update user schema (partial updates)
 * Based on PropelAuth's user update capabilities
 */
export const PartialUpdateUserZodSchema = z.object({
  first_name: z.string().min(1, "First name must not be empty").optional(),
  last_name: z.string().min(1, "Last name must not be empty").optional(),
  picture_url: z.string().url("Invalid picture URL").optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateUserRequest = z.infer<typeof PartialUpdateUserZodSchema>;

/**
 * Update user password schema
 */
export const UpdateUserPasswordZodSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
});

export type UpdateUserPasswordRequest = z.infer<
  typeof UpdateUserPasswordZodSchema
>;

/**
 * Update user role in organisation schema
 */
export const UpdateUserRoleZodSchema = z.object({
  org_id: z.string().min(1, "Organization ID is required"),
  role: z.string().min(1, "Role is required"),
});

export type UpdateUserRoleRequest = z.infer<typeof UpdateUserRoleZodSchema>;
