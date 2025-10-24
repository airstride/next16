/**
 * Subscription Types and Configuration
 * Defines subscription tiers, features, and limits
 */

import { NextResponse } from "next/server";

export enum SubscriptionTier {
  TRIAL = "TRIAL",
  BASIC = "BASIC",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
}

/**
 * Display name mapping for subscription tiers
 */
export const subscriptionTierDisplayMap: Record<SubscriptionTier, string> = {
  [SubscriptionTier.TRIAL]: "Trial",
  [SubscriptionTier.BASIC]: "Basic",
  [SubscriptionTier.PRO]: "Pro",
  [SubscriptionTier.ENTERPRISE]: "Enterprise",
};

/**
 * Subscription tier features and limits
 */
export const subscriptionTierFeatures: Record<
  SubscriptionTier,
  {
    name: string;
    description: string;
    price: string;
    features: string[];
    featureFlags: {
      prioritySupport: boolean;
      dedicatedAccountManager: boolean;
    };
    limits: {
      users: number | string;
      partners: number | string;
      deals: number | string;
      storage: string;
    };
    color: string;
    popular?: boolean;
  }
> = {
  [SubscriptionTier.TRIAL]: {
    name: "Trial",
    description: "Perfect for trying out the platform",
    price: "Free",
    features: [
      "Up to 5 users",
      "Up to 50 partners",
      "Basic deal registration",
      "Email support",
      "5GB storage",
    ],
    featureFlags: {
      prioritySupport: false,
      dedicatedAccountManager: false,
    },
    limits: {
      users: 5,
      partners: 50,
      deals: 100,
      storage: "5GB",
    },
    color: "gray",
  },
  [SubscriptionTier.BASIC]: {
    name: "Basic",
    description: "Essential features for small teams",
    price: "$99/month",
    features: [
      "Up to 25 users",
      "Up to 500 partners",
      "Advanced deal registration",
      "CRM integration",
      "Priority email support",
      "50GB storage",
      "Basic analytics",
    ],
    featureFlags: {
      prioritySupport: false,
      dedicatedAccountManager: false,
    },
    limits: {
      users: 25,
      partners: 500,
      deals: 1000,
      storage: "50GB",
    },
    color: "blue",
  },
  [SubscriptionTier.PRO]: {
    name: "Pro",
    description: "Advanced features for growing businesses",
    price: "$299/month",
    features: [
      "Up to 100 users",
      "Unlimited partners",
      "Advanced analytics",
      "Account mapping",
      "Partner scoring & AI insights",
      "Collaboration hub",
      "Priority support",
      "500GB storage",
      "Custom integrations",
    ],
    featureFlags: {
      prioritySupport: true,
      dedicatedAccountManager: false,
    },
    limits: {
      users: 100,
      partners: "Unlimited",
      deals: "Unlimited",
      storage: "500GB",
    },
    color: "violet",
    popular: true,
  },
  [SubscriptionTier.ENTERPRISE]: {
    name: "Enterprise",
    description: "Full platform access with dedicated support",
    price: "Custom",
    features: [
      "Unlimited users",
      "Unlimited partners",
      "Everything in Pro",
      "Dedicated account manager",
      "Custom onboarding",
      "SLA guarantees",
      "Advanced security",
      "Unlimited storage",
      "White-label options",
      "API access",
    ],
    featureFlags: {
      prioritySupport: true,
      dedicatedAccountManager: true,
    },
    limits: {
      users: "Unlimited",
      partners: "Unlimited",
      deals: "Unlimited",
      storage: "Unlimited",
    },
    color: "orange",
  },
};

/**
 * Subscription check configuration for withSubscription HOF
 */
export type SubscriptionConfig = {
  requiredTier?: SubscriptionTier;
  minTier?: SubscriptionTier;
  customCheck?: (
    tier: SubscriptionTier,
    features: typeof subscriptionTierFeatures
  ) => boolean;
  onInsufficientTier?: (
    currentTier: SubscriptionTier,
    requiredTier: SubscriptionTier
  ) => NextResponse | Promise<NextResponse>;
};

/**
 * Utility: Check if a tier meets minimum requirement
 */
export function meetsMinimumTier(
  currentTier: SubscriptionTier,
  minTier: SubscriptionTier
): boolean {
  const tierHierarchy = {
    [SubscriptionTier.TRIAL]: 1,
    [SubscriptionTier.BASIC]: 2,
    [SubscriptionTier.PRO]: 3,
    [SubscriptionTier.ENTERPRISE]: 4,
  } as const;

  return tierHierarchy[currentTier] >= tierHierarchy[minTier];
}

/**
 * Validates subscription tier against configuration
 */
export function validateSubscriptionTier(
  tier: SubscriptionTier,
  _features: (typeof subscriptionTierFeatures)[SubscriptionTier],
  config: SubscriptionConfig
): { valid: boolean; requiredTier?: SubscriptionTier } {
  const tierHierarchy = {
    [SubscriptionTier.TRIAL]: 1,
    [SubscriptionTier.BASIC]: 2,
    [SubscriptionTier.PRO]: 3,
    [SubscriptionTier.ENTERPRISE]: 4,
  } as const;

  // Check exact tier requirement
  if (config.requiredTier) {
    if (tier !== config.requiredTier) {
      return { valid: false, requiredTier: config.requiredTier };
    }
  }

  // Check minimum tier requirement
  if (config.minTier) {
    const currentLevel = tierHierarchy[tier];
    const minLevel = tierHierarchy[config.minTier];

    if (currentLevel < minLevel) {
      return { valid: false, requiredTier: config.minTier };
    }
  }

  // Check custom validation
  if (config.customCheck) {
    const isValid = config.customCheck(tier, subscriptionTierFeatures);
    if (!isValid) {
      return { valid: false };
    }
  }

  return { valid: true };
}
