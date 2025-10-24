/**
 * Subscriptions Module - Domain Types
 *
 * ============================================
 * DOMAIN LAYER - Pure Business Logic
 * ============================================
 *
 * Database-agnostic subscription types.
 * Mirrors Mongoose schema structure with snake_case.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: @/shared/types/repository.types
 * ❌ CANNOT import: mongoose, infrastructure, application, api
 */

import { IEntity, DatabaseId } from "@/shared/types/repository.types";

// ============================================
// ENUMS
// ============================================

/**
 * Subscription tier levels
 */
export enum SubscriptionTier {
  FREE = "free",
  STARTER = "starter",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

export const SubscriptionTierValues = Object.values(SubscriptionTier);

/**
 * Subscription status
 */
export enum SubscriptionStatus {
  ACTIVE = "active",
  TRIAL = "trial",
  PAST_DUE = "past_due",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}

export const SubscriptionStatusValues = Object.values(SubscriptionStatus);

/**
 * Billing cycle
 */
export enum BillingCycle {
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export const BillingCycleValues = Object.values(BillingCycle);

// ============================================
// DOMAIN INTERFACES
// ============================================

/**
 * Feature limits configuration
 */
export interface ISubscriptionLimits {
  projects?: number;
  users?: number;
  api_calls_per_month?: number;
  storage_gb?: number;
}

/**
 * Current usage tracking
 */
export interface ISubscriptionUsage {
  projects_count: number;
  users_count: number;
  api_calls_count: number;
  storage_used_gb: number;
}

// ============================================
// ROOT DOMAIN ENTITY
// ============================================

/**
 * ISubscription - Database-Agnostic Subscription Entity
 *
 * Mirrors Mongoose schema structure (single source of truth).
 * Links to PropelAuth organizations via propel_auth_org_id.
 *
 * @extends IEntity<DatabaseId> - Inherits base entity fields
 */
export interface ISubscription extends IEntity<DatabaseId> {
  // PropelAuth organization link
  propel_auth_org_id: string;

  // Subscription details
  tier: SubscriptionTier;
  status: SubscriptionStatus;

  // Trial management
  trial_started_at?: Date;
  trial_ends_at?: Date;

  // Billing
  billing_cycle: BillingCycle;
  current_period_start?: Date;
  current_period_end?: Date;

  // Payment provider (Stripe)
  stripe_customer_id?: string;
  stripe_subscription_id?: string;

  // Limits and usage
  limits?: ISubscriptionLimits;
  usage: ISubscriptionUsage;

  // Usage tracking
  usage_reset_at?: Date;
  usage_period_start?: Date;

  // Metadata
  metadata?: Map<string, string>;

  // Base entity fields (inherited)
  // _id, created_by, updated_by, created_at, updated_at, is_deleted
}
