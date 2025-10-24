/**
 * Subscription Tier Limits Configuration
 *
 * Defines feature limits and access for each subscription tier.
 * Used by SubscriptionsService for payment walls and limit enforcement.
 */

import { SubscriptionTier } from "./types";

// ============================================
// TIER LIMITS
// ============================================

export interface TierConfig {
  name: string;
  limits: {
    projects: number; // -1 = unlimited
    users: number;
    api_calls_per_month: number;
    storage_gb: number;
  };
  features: string[]; // "*" means all features
  trial_days?: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierConfig> = {
  [SubscriptionTier.FREE]: {
    name: "Free",
    limits: {
      projects: 1,
      users: 2,
      api_calls_per_month: 100,
      storage_gb: 1,
    },
    features: ["basic_projects", "manual_context"],
    trial_days: 0,
  },

  [SubscriptionTier.STARTER]: {
    name: "Starter",
    limits: {
      projects: 5,
      users: 5,
      api_calls_per_month: 1000,
      storage_gb: 10,
    },
    features: ["basic_projects", "manual_context", "analytics", "export_data"],
    trial_days: 14,
  },

  [SubscriptionTier.PRO]: {
    name: "Pro",
    limits: {
      projects: 25,
      users: 15,
      api_calls_per_month: 10000,
      storage_gb: 50,
    },
    features: [
      "basic_projects",
      "manual_context",
      "analytics",
      "export_data",
      "ai_research",
      "automation",
      "priority_support",
    ],
    trial_days: 14,
  },

  [SubscriptionTier.ENTERPRISE]: {
    name: "Enterprise",
    limits: {
      projects: -1, // unlimited
      users: -1,
      api_calls_per_month: -1,
      storage_gb: 500,
    },
    features: ["*"], // all features
    trial_days: 30,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a tier has access to a specific feature
 */
export function tierHasFeature(
  tier: SubscriptionTier,
  feature: string
): boolean {
  const config = TIER_LIMITS[tier];

  // Enterprise has all features
  if (config.features[0] === "*") {
    return true;
  }

  return config.features.includes(feature);
}

/**
 * Check if tierA is equal to or higher than tierB
 */
export function tierIsAtLeast(
  tierA: SubscriptionTier,
  tierB: SubscriptionTier
): boolean {
  const tierOrder = [
    SubscriptionTier.FREE,
    SubscriptionTier.STARTER,
    SubscriptionTier.PRO,
    SubscriptionTier.ENTERPRISE,
  ];

  return tierOrder.indexOf(tierA) >= tierOrder.indexOf(tierB);
}

/**
 * Get limit for a specific resource type
 */
export function getTierLimit(
  tier: SubscriptionTier,
  limitType: keyof TierConfig["limits"]
): number {
  return TIER_LIMITS[tier].limits[limitType];
}

/**
 * Check if usage is within limits for a tier
 */
export function isWithinLimit(
  tier: SubscriptionTier,
  limitType: keyof TierConfig["limits"],
  currentUsage: number
): boolean {
  const limit = getTierLimit(tier, limitType);

  // -1 means unlimited
  if (limit === -1) {
    return true;
  }

  return currentUsage < limit;
}
