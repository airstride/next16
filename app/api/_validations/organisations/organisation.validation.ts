/**
 * Validation schemas for organisation operations
 */

import { z } from "zod";

/**
 * Update organisation schema
 * Supports partial updates to organisation properties
 */
export const UpdateOrganisationSchema = z.object({
  name: z.string().min(1, "Organization name must not be empty").optional(),
  can_setup_saml: z.boolean().optional(),
  max_users: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  can_join_on_email_domain_match: z.boolean().optional(),
  members_must_have_email_domain_match: z.boolean().optional(),
  domain: z.string().optional(),
  require_2fa_by: z.string().optional(),
  extra_domains: z.array(z.string()).optional(),
});

export type UpdateOrganisationRequest = z.infer<
  typeof UpdateOrganisationSchema
>;
