/**
 * Subscription Factory
 *
 * ============================================
 * APPLICATION LAYER - Data Transformation
 * ============================================
 *
 * Transforms API requests to domain entities.
 * Since both use snake_case, this is mostly pass-through.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/types
 * ✅ CAN import: ../api/validation
 * ✅ CAN import: @/shared/db/base.factory
 * ❌ CANNOT import: ../infrastructure/schema
 */

import { BaseFactory } from "@/shared/db/base.factory";
import {
  ISubscription,
  SubscriptionTier,
  SubscriptionStatus,
  BillingCycle,
} from "../domain/types";
import { TIER_LIMITS } from "../domain/tier-limits";
import {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from "../api/validation";

/**
 * SubscriptionFactory
 *
 * Handles data transformation for subscriptions.
 */
export class SubscriptionFactory extends BaseFactory<
  ISubscription,
  CreateSubscriptionInput,
  UpdateSubscriptionInput
> {
  /**
   * Map request to entity
   * Direct pass-through since both use snake_case
   */
  protected mapRequestToEntity(
    request: Partial<CreateSubscriptionInput> | UpdateSubscriptionInput
  ): Partial<ISubscription> {
    return request as Partial<ISubscription>;
  }

  /**
   * Apply business logic during creation
   * Sets default values based on tier
   */
  protected applyCreateBusinessLogic(
    request: CreateSubscriptionInput,
    _userId: string,
    _orgId: string
  ): Partial<ISubscription> {
    // Mark parameters as intentionally unused in this implementation
    void _userId;
    void _orgId;

    const tier = request.tier || SubscriptionTier.FREE;
    const tierConfig = TIER_LIMITS[tier];

    // Calculate trial dates
    const now = new Date();
    const trialDays = request.trial_days ?? tierConfig.trial_days ?? 0;
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    return {
      tier,
      status:
        trialDays > 0 ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE,
      billing_cycle: BillingCycle.MONTHLY, // Default to monthly billing
      trial_started_at: trialDays > 0 ? now : undefined,
      trial_ends_at: trialDays > 0 ? trialEndsAt : undefined,
      limits: {
        projects: tierConfig.limits.projects,
        users: tierConfig.limits.users,
        api_calls_per_month: tierConfig.limits.api_calls_per_month,
        storage_gb: tierConfig.limits.storage_gb,
      },
      usage: {
        projects_count: 0,
        users_count: 0,
        api_calls_count: 0,
        storage_used_gb: 0,
      },
      usage_period_start: now,
      usage_reset_at: now,
    };
  }

  /**
   * Create subscription for PropelAuth organization
   */
  createForOrganization(
    propelAuthOrgId: string,
    tier: SubscriptionTier,
    userId: string,
    trialDays?: number
  ): ISubscription {
    // Use the full factory method to ensure all required fields are populated
    const request: Partial<CreateSubscriptionInput> = {
      propel_auth_org_id: propelAuthOrgId,
      tier,
      trial_days: trialDays,
    };

    // Call createFromRequest to properly initialize all base entity fields
    return this.createFromRequest(
      request as CreateSubscriptionInput,
      userId,
      propelAuthOrgId
    );
  }

  /**
   * Update tier and adjust limits
   */
  updateTier(
    _existingSubscription: ISubscription,
    newTier: SubscriptionTier,
    userId: string
  ): Partial<ISubscription> {
    const tierConfig = TIER_LIMITS[newTier];

    return {
      tier: newTier,
      limits: {
        projects: tierConfig.limits.projects,
        users: tierConfig.limits.users,
        api_calls_per_month: tierConfig.limits.api_calls_per_month,
        storage_gb: tierConfig.limits.storage_gb,
      },
      updated_by: userId,
    };
  }
}

// Export singleton instance
export const subscriptionFactory = new SubscriptionFactory();
