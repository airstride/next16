/**
 * Validation schemas for user invitations
 */

import { z } from "zod";

/**
 * Invite user to organization schema
 */
export const InviteUserSchema = z.object({
  email: z.email("Invalid email address"),
  org_id: z.string().min(1, "Organization ID is required"),
  role: z.string().optional(),
  additional_roles: z.array(z.string()).optional(),
});

export type InviteUserRequest = z.infer<typeof InviteUserSchema>;

/**
 * Revoke invite schema
 */
export const RevokeInviteSchema = z.object({
  invitee_email: z.email("Invalid email address"),
  org_id: z.string().min(1, "Organization ID is required"),
});

export type RevokeInviteRequest = z.infer<typeof RevokeInviteSchema>;
