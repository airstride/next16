/**
 * Subscription Response DTO
 *
 * ============================================
 * API LAYER - Response Data Transfer Objects
 * ============================================
 *
 * Transforms domain entities to API responses.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/types
 * ✅ CAN import: ./validation
 * ❌ CANNOT import: ../infrastructure/schema
 */

import { ISubscription } from "../domain/types";
import { SubscriptionResponse } from "./validation";

/**
 * Subscription Response Builder
 */
export class SubscriptionResponseDTO {
  /**
   * Transform domain entity to API response
   * Direct mapping since both use snake_case
   */
  static fromSubscription(entity: ISubscription): SubscriptionResponse {
    return {
      id: entity._id.toString(),
      propel_auth_org_id: entity.propel_auth_org_id,
      tier: entity.tier,
      status: entity.status,
      trial_started_at: entity.trial_started_at,
      trial_ends_at: entity.trial_ends_at,
      billing_cycle: entity.billing_cycle,
      current_period_start: entity.current_period_start,
      current_period_end: entity.current_period_end,
      stripe_customer_id: entity.stripe_customer_id,
      stripe_subscription_id: entity.stripe_subscription_id,
      limits: entity.limits,
      usage: entity.usage,
      usage_reset_at: entity.usage_reset_at,
      usage_period_start: entity.usage_period_start,
      metadata: entity.metadata
        ? Object.fromEntries(entity.metadata)
        : undefined,
      user_id: entity.created_by,
      organization_id: entity.created_by_propel_auth_org_id,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      created_by: entity.created_by,
      updated_by: entity.updated_by,
    };
  }

  /**
   * Transform multiple entities
   */
  static fromSubscriptions(entities: ISubscription[]): SubscriptionResponse[] {
    return entities.map((entity) => this.fromSubscription(entity));
  }
}
