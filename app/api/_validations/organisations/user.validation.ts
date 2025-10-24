/**
 * Validation schemas for organisation user operations
 */

import { z } from "zod";

/**
 * Remove user from organisation schema
 */
export const RemoveUserFromOrgSchema = z.object({
  orgId: z.string().min(1, "Organization ID is required"),
});

export type RemoveUserFromOrgRequest = z.infer<typeof RemoveUserFromOrgSchema>;
