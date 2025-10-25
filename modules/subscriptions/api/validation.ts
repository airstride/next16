/**
 * Subscriptions Module - API Validation Schemas
 *
 * ============================================
 * API LAYER - Input/Output Validation
 * ============================================
 *
 * Zod schemas for subscription API requests and responses.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/types (enums)
 * ✅ CAN import: @/shared/validation
 * ❌ CANNOT import: ../infrastructure/schema
 */

import { z } from "zod";
import {
  SubscriptionTierValues,
  SubscriptionStatusValues,
  BillingCycleValues,
  SubscriptionTier,
} from "../domain/types";
import {
  createResponseSchema,
  createInputSchema,
} from "@/shared/validation/base.validation";
import { BrandedZodType } from "@/shared/types/validation.types";

export const CreateSubscriptionInputBrand = Symbol(
  "CreateSubscriptionInputBrand"
);
export const UpdateSubscriptionInputBrand = Symbol(
  "UpdateSubscriptionInputBrand"
);
export const IncrementUsageInputBrand = Symbol("IncrementUsageInputBrand");
export const SubscriptionResponseBrand = Symbol("SubscriptionResponseBrand");
export const LimitCheckResponseBrand = Symbol("LimitCheckResponseBrand");
export const FeatureAccessResponseBrand = Symbol("FeatureAccessResponseBrand");

// ============================================
// INPUT SCHEMAS
// ============================================

/**
 * Create subscription for an organization
 */
export const CreateSubscriptionInputSchema = createInputSchema(
  z.object({
    propel_auth_org_id: z.string().min(1, "Organization ID is required"),
    tier: z.enum(SubscriptionTierValues).default(SubscriptionTier.FREE),
    trial_days: z.number().int().min(0).optional(),
  })
);

export type CreateSubscriptionInput = BrandedZodType<
  z.infer<typeof CreateSubscriptionInputSchema>,
  typeof CreateSubscriptionInputBrand
>;

/**
 * Update subscription
 */
export const UpdateSubscriptionInputSchema = z.object({
  tier: z.enum(SubscriptionTierValues).optional(),
  status: z.enum(SubscriptionStatusValues).optional(),
  billing_cycle: z.enum(BillingCycleValues).optional(),
  stripe_customer_id: z.string().optional(),
  stripe_subscription_id: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type UpdateSubscriptionInput = z.infer<
  typeof UpdateSubscriptionInputSchema
>;

/**
 * Increment usage
 */
export const IncrementUsageInputSchema = z.object({
  usage_type: z.enum(["clients", "users", "api_calls", "storage"]),
  amount: z.number().int().min(1).default(1),
});

export type IncrementUsageInput = z.infer<typeof IncrementUsageInputSchema>;

// ============================================
// RESPONSE SCHEMAS
// ============================================

/**
 * Subscription response fields
 */
const SubscriptionResponseFieldsSchema = z.object({
  propel_auth_org_id: z.string(),
  tier: z.string(),
  status: z.string(),
  trial_started_at: z.date().optional(),
  trial_ends_at: z.date().optional(),
  billing_cycle: z.string(),
  current_period_start: z.date().optional(),
  current_period_end: z.date().optional(),
  stripe_customer_id: z.string().optional(),
  stripe_subscription_id: z.string().optional(),
  limits: z
    .object({
      projects: z.number().optional(),
      users: z.number().optional(),
      api_calls_per_month: z.number().optional(),
      storage_gb: z.number().optional(),
    })
    .optional(),
  usage: z.object({
    projects_count: z.number(),
    users_count: z.number(),
    api_calls_count: z.number(),
    storage_used_gb: z.number(),
  }),
  usage_reset_at: z.date().optional(),
  usage_period_start: z.date().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

/**
 * Full subscription response with base fields
 */
export const SubscriptionResponseSchema = createResponseSchema(
  SubscriptionResponseFieldsSchema
);

export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>;

/**
 * Limit check response
 */
export const LimitCheckResponseSchema = z.object({
  within_limit: z.boolean(),
  current_usage: z.number(),
  limit: z.number(),
  remaining: z.number(),
  limit_type: z.string(),
});

export type LimitCheckResponse = z.infer<typeof LimitCheckResponseSchema>;

/**
 * Feature access response
 */
export const FeatureAccessResponseSchema = z.object({
  has_access: z.boolean(),
  feature: z.string(),
  tier: z.string(),
  required_tier: z.string().optional(),
});

export type FeatureAccessResponse = z.infer<typeof FeatureAccessResponseSchema>;
