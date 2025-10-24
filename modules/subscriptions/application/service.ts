/**
 * Subscriptions Module - Service Layer
 *
 * ============================================
 * APPLICATION LAYER - Business Logic
 * ============================================
 *
 * Handles subscription management, limit checking, and feature access.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/types
 * ✅ CAN import: ../api/validation
 * ✅ CAN import: ./factory
 * ✅ CAN import: SUBSCRIPTION_MODEL_NAME constant
 * ❌ CANNOT import: SubscriptionDocument
 */

import { BaseService } from "@/shared/services/base.service";
import {
  ISubscription,
  SubscriptionTier,
  SubscriptionStatus,
} from "../domain/types";
import { SUBSCRIPTION_MODEL_NAME } from "../infrastructure/schema";
import {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  SubscriptionResponse,
} from "../api/validation";
import {
  TIER_LIMITS,
  tierHasFeature,
  tierIsAtLeast,
  getTierLimit,
  isWithinLimit,
} from "../domain/tier-limits";
import { NotFoundError, ValidationError } from "@/shared/utils/errors";
import { logger } from "@/shared/utils/logger";
import { subscriptionFactory } from "./factory";
import { SubscriptionResponseDTO } from "../api/response";

const log = logger.child({ module: "subscriptions-service" });

/**
 * SubscriptionsService
 *
 * Manages subscriptions, payment walls, and usage tracking.
 */
export class SubscriptionsService extends BaseService<
  ISubscription,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  SubscriptionResponse
> {
  constructor() {
    super(SUBSCRIPTION_MODEL_NAME);
  }

  /**
   * ========================================================================
   * Abstract Method Implementations
   * ========================================================================
   */

  protected mapEntityToResponse(entity: ISubscription): SubscriptionResponse {
    return SubscriptionResponseDTO.fromSubscription(entity);
  }

  protected prepareEntityForCreate(
    request: CreateSubscriptionInput,
    userId: string,
    _orgId: string
  ): ISubscription {
    // orgId is not used here - subscription uses propel_auth_org_id from request
    void _orgId;

    return subscriptionFactory.createForOrganization(
      request.propel_auth_org_id,
      request.tier || SubscriptionTier.FREE,
      userId,
      request.trial_days
    );
  }

  protected prepareEntityForUpdate(
    request: UpdateSubscriptionInput,
    userId: string
  ): Partial<ISubscription> {
    // Convert metadata from Record to Map if present
    const metadata = request.metadata
      ? new Map(Object.entries(request.metadata))
      : undefined;

    return {
      ...request,
      metadata,
      updated_by: userId,
    };
  }

  /**
   * ========================================================================
   * Subscription Management
   * ========================================================================
   */

  /**
   * Create subscription for PropelAuth organization
   */
  async createForOrganization(
    propelAuthOrgId: string,
    tier: SubscriptionTier = SubscriptionTier.FREE,
    userId: string,
    trialDays?: number
  ): Promise<SubscriptionResponse> {
    log.info("Creating subscription for organization", {
      propelAuthOrgId,
      tier,
    });

    // Check if subscription already exists
    const existing = await this.getByOrganization(propelAuthOrgId);
    if (existing) {
      throw new ValidationError(
        "Subscription already exists for this organization"
      );
    }

    const subscriptionData = subscriptionFactory.createForOrganization(
      propelAuthOrgId,
      tier,
      userId,
      trialDays
    );

    const subscription = await this.repository.create(subscriptionData);

    log.info("Subscription created", {
      subscriptionId: String(subscription._id),
      propelAuthOrgId,
    });

    return this.mapEntityToResponse(subscription);
  }

  /**
   * Get subscription by PropelAuth org ID
   */
  async getByOrganization(
    propelAuthOrgId: string
  ): Promise<SubscriptionResponse | null> {
    log.debug("Getting subscription by org ID", { propelAuthOrgId });

    const [subscriptions] = await this.repository.find({
      propel_auth_org_id: propelAuthOrgId,
    });

    if (subscriptions.length === 0) {
      return null;
    }

    return this.mapEntityToResponse(subscriptions[0]);
  }

  /**
   * Update subscription tier
   */
  async updateTier(
    propelAuthOrgId: string,
    newTier: SubscriptionTier,
    userId: string
  ): Promise<SubscriptionResponse> {
    log.info("Updating subscription tier", { propelAuthOrgId, newTier });

    const subscription = await this.getByOrganization(propelAuthOrgId);
    if (!subscription) {
      throw new NotFoundError("Subscription not found");
    }

    // Get the full entity for factory
    const [entities] = await this.repository.find({
      propel_auth_org_id: propelAuthOrgId,
    });
    const entity = entities[0];

    const updateData = subscriptionFactory.updateTier(entity, newTier, userId);

    const updated = await this.repository.updateById(
      subscription.id,
      updateData
    );

    if (!updated) {
      throw new NotFoundError("Subscription not found after update");
    }

    log.info("Subscription tier updated", {
      subscriptionId: subscription.id,
      newTier,
    });

    return this.mapEntityToResponse(updated);
  }

  /**
   * ========================================================================
   * Payment Wall - Feature Access
   * ========================================================================
   */

  /**
   * Check if organization has access to a feature
   */
  async checkFeatureAccess(
    propelAuthOrgId: string,
    feature: string
  ): Promise<boolean> {
    const subscription = await this.getByOrganization(propelAuthOrgId);

    if (!subscription) {
      log.warn("No subscription found, denying feature access", {
        propelAuthOrgId,
        feature,
      });
      return false;
    }

    // Trial or expired subscriptions have limited access
    if (
      subscription.status === SubscriptionStatus.EXPIRED ||
      subscription.status === SubscriptionStatus.CANCELLED
    ) {
      log.warn("Subscription not active, denying feature access", {
        propelAuthOrgId,
        feature,
        status: subscription.status,
      });
      return false;
    }

    const tier = subscription.tier as SubscriptionTier;
    const hasAccess = tierHasFeature(tier, feature);

    log.debug("Feature access check", {
      propelAuthOrgId,
      feature,
      tier,
      hasAccess,
    });

    return hasAccess;
  }

  /**
   * Check if tier meets minimum requirement
   */
  async checkTierRequirement(
    propelAuthOrgId: string,
    requiredTier: SubscriptionTier
  ): Promise<boolean> {
    const subscription = await this.getByOrganization(propelAuthOrgId);

    if (!subscription) {
      return false;
    }

    const tier = subscription.tier as SubscriptionTier;
    return tierIsAtLeast(tier, requiredTier);
  }

  /**
   * ========================================================================
   * Payment Wall - Usage Limits
   * ========================================================================
   */

  /**
   * Check if organization is within usage limit
   */
  async checkLimit(
    propelAuthOrgId: string,
    limitType: "projects" | "users" | "api_calls_per_month" | "storage_gb"
  ): Promise<boolean> {
    const subscription = await this.getByOrganization(propelAuthOrgId);

    if (!subscription) {
      log.warn("No subscription found, denying limit check", {
        propelAuthOrgId,
        limitType,
      });
      return false;
    }

    const tier = subscription.tier as SubscriptionTier;
    const currentUsage = this.getCurrentUsage(subscription, limitType);
    const withinLimit = isWithinLimit(tier, limitType, currentUsage);

    log.debug("Limit check", {
      propelAuthOrgId,
      limitType,
      currentUsage,
      limit: getTierLimit(tier, limitType),
      withinLimit,
    });

    return withinLimit;
  }

  /**
   * Get current usage for a limit type
   */
  private getCurrentUsage(
    subscription: SubscriptionResponse,
    limitType: string
  ): number {
    switch (limitType) {
      case "projects":
        return subscription.usage.projects_count;
      case "users":
        return subscription.usage.users_count;
      case "api_calls_per_month":
        return subscription.usage.api_calls_count;
      case "storage_gb":
        return subscription.usage.storage_used_gb;
      default:
        return 0;
    }
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(
    propelAuthOrgId: string,
    usageType: "projects" | "users" | "api_calls" | "storage",
    amount: number = 1
  ): Promise<void> {
    log.debug("Incrementing usage", { propelAuthOrgId, usageType, amount });

    const subscription = await this.getByOrganization(propelAuthOrgId);
    if (!subscription) {
      log.warn("No subscription found for usage increment", {
        propelAuthOrgId,
      });
      return;
    }

    const usageField = `usage.${usageType}_count`;

    await this.repository.atomicUpdate(subscription.id, {
      [usageField]: amount,
    });

    log.debug("Usage incremented", { propelAuthOrgId, usageType, amount });
  }

  /**
   * Reset monthly usage counters
   */
  async resetMonthlyUsage(propelAuthOrgId: string): Promise<void> {
    log.info("Resetting monthly usage", { propelAuthOrgId });

    const subscription = await this.getByOrganization(propelAuthOrgId);
    if (!subscription) {
      return;
    }

    await this.repository.updateById(subscription.id, {
      usage: {
        projects_count: subscription.usage.projects_count, // Keep projects
        users_count: subscription.usage.users_count, // Keep users
        api_calls_count: 0, // Reset API calls
        storage_used_gb: subscription.usage.storage_used_gb, // Keep storage
      },
      usage_reset_at: new Date(),
    });

    log.info("Monthly usage reset", { propelAuthOrgId });
  }

  /**
   * ========================================================================
   * Trial Management
   * ========================================================================
   */

  /**
   * Check if trial is expired
   */
  async isTrialExpired(propelAuthOrgId: string): Promise<boolean> {
    const subscription = await this.getByOrganization(propelAuthOrgId);

    if (!subscription || subscription.status !== SubscriptionStatus.TRIAL) {
      return false;
    }

    if (!subscription.trial_ends_at) {
      return false;
    }

    return new Date() > subscription.trial_ends_at;
  }

  /**
   * Expire trial and downgrade to free tier
   */
  async expireTrial(propelAuthOrgId: string): Promise<void> {
    log.info("Expiring trial", { propelAuthOrgId });

    const subscription = await this.getByOrganization(propelAuthOrgId);
    if (!subscription) {
      return;
    }

    await this.repository.updateById(subscription.id, {
      status: SubscriptionStatus.EXPIRED,
      tier: SubscriptionTier.FREE,
      limits: TIER_LIMITS[SubscriptionTier.FREE].limits,
    });

    log.info("Trial expired, downgraded to free", { propelAuthOrgId });
  }
}

/**
 * Export singleton instance
 */
export const subscriptionsService = new SubscriptionsService();
