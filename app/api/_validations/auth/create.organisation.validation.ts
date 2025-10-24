/**
 * Validation schemas for organisation creation
 */

import { z } from "zod";

/**
 * Create organisation schema
 * Based on PropelAuth's CreateOrgRequest interface
 */
export const CreateOrganisationZodSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  enable_auto_joining_by_domain: z.boolean().optional(),
  members_must_have_matching_domain: z.boolean().optional(),
  domain: z.string().optional(),
  max_users: z.number().int().positive().optional(),
  can_setup_saml: z.boolean().optional(),
  legacy_org_id: z.string().optional(),
  extra_domains: z.array(z.string()).optional(),
});

export type CreateOrganisationRequest = z.infer<
  typeof CreateOrganisationZodSchema
>;
