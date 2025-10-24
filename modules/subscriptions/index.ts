/**
 * Subscriptions Module - Public API
 *
 * ============================================
 * BARREL EXPORT WITH ARCHITECTURAL BOUNDARIES
 * ============================================
 *
 * Controls what is exported from the subscriptions module.
 */

// ============================================
// DOMAIN LAYER
// ============================================

export type {
  ISubscription,
  ISubscriptionLimits,
  ISubscriptionUsage,
} from "./domain/types";

export {
  SubscriptionTier,
  SubscriptionStatus,
  BillingCycle,
  SubscriptionTierValues,
  SubscriptionStatusValues,
  BillingCycleValues,
} from "./domain/types";

export {
  TIER_LIMITS,
  tierHasFeature,
  tierIsAtLeast,
  getTierLimit,
  isWithinLimit,
  type TierConfig,
} from "./domain/tier-limits";

// ============================================
// APPLICATION LAYER
// ============================================

export {
  SubscriptionsService,
  subscriptionsService,
} from "./application/service";

export {
  SubscriptionFactory,
  subscriptionFactory,
} from "./application/factory";

// ============================================
// API LAYER
// ============================================

export {
  CreateSubscriptionInputSchema,
  UpdateSubscriptionInputSchema,
  IncrementUsageInputSchema,
  SubscriptionResponseSchema,
  LimitCheckResponseSchema,
  FeatureAccessResponseSchema,
  type CreateSubscriptionInput,
  type UpdateSubscriptionInput,
  type IncrementUsageInput,
  type SubscriptionResponse,
  type LimitCheckResponse,
  type FeatureAccessResponse,
} from "./api/validation";

export { SubscriptionResponseDTO } from "./api/response";

export { subscriptionQueryConfig } from "./api/query.config";

// ============================================
// INFRASTRUCTURE LAYER
// ============================================

export { SUBSCRIPTION_MODEL_NAME } from "./infrastructure/schema";

// ❌ DO NOT EXPORT:
// - SubscriptionDocument (Mongoose-specific type)
// - SubscriptionModel (Mongoose model)
