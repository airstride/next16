/**
 * withSubscription Higher-Order Function
 *
 * Payment wall middleware that checks subscription tier and feature access.
 * Adds subscription data to context props.
 *
 * Usage:
 * ```typescript
 * export const POST = withAuth(
 *   withDB(
 *     withSubscription({
 *       requiredTier: SubscriptionTier.PRO,
 *       requiredFeature: 'ai_research'
 *     })(
 *       async (req, params, { auth, subscription }) => {
 *         // handler logic
 *       }
 *     )
 *   )
 * );
 * ```
 */

import { NextResponse } from "next/server";
import { CoreHandler } from "@/shared/types/api-hof.types";
import {
  subscriptionsService,
  SubscriptionTier,
  SubscriptionStatus,
  type SubscriptionResponse,
} from "@/modules/subscriptions";
import { logger } from "@/shared/utils/logger";

const log = logger.child({ module: "with-subscription-hof" });

/**
 * Subscription requirement configuration
 */
export interface SubscriptionConfig {
  /** Minimum tier required (e.g., PRO or higher) */
  requiredTier?: SubscriptionTier;

  /** Specific feature required */
  requiredFeature?: string;

  /** Custom check function */
  customCheck?: (
    subscription: SubscriptionResponse
  ) => boolean | Promise<boolean>;

  /** Skip check (useful for conditional middleware) */
  skip?: boolean;
}

/**
 * Props added to context by withSubscription
 */
export interface WithSubscriptionProps {
  subscription: SubscriptionResponse;
}

/**
 * Payment Required (402) response
 */
function PaymentRequiredResponse(message: string, details?: unknown) {
  return NextResponse.json(
    {
      error: "Payment Required",
      message,
      statusCode: 402,
      details,
    },
    { status: 402 }
  );
}

/**
 * withSubscription HOF
 *
 * Checks subscription tier, features, and limits before allowing access.
 */
export function withSubscription(config: SubscriptionConfig = {}) {
  return <
    P extends Record<string, string> = Record<string, string>,
    TProps extends Record<string, unknown> = Record<string, unknown>
  >(
    handler: CoreHandler<P, TProps & WithSubscriptionProps>
  ): CoreHandler<P, TProps> => {
    return async (request, params, props) => {
      // Skip check if configured
      if (config.skip) {
        log.debug("Subscription check skipped");
        return handler(
          request,
          params,
          props as TProps & WithSubscriptionProps
        );
      }

      // Ensure auth props exist
      if (!("auth" in props) || !props.auth) {
        log.error("withSubscription requires withAuth to be called first");
        return NextResponse.json(
          {
            error: "Internal Server Error",
            message: "Authentication context missing",
            statusCode: 500,
          },
          { status: 500 }
        );
      }

      const auth = props.auth as { activeOrgId: string; userId: string };

      try {
        // Get subscription for organization
        const subscription = await subscriptionsService.getByOrganization(
          auth.activeOrgId
        );

        if (!subscription) {
          log.warn("No subscription found for organization", {
            orgId: auth.activeOrgId,
          });
          return PaymentRequiredResponse(
            "No active subscription found. Please subscribe to continue."
          );
        }

        // Check if subscription is active
        if (
          subscription.status === SubscriptionStatus.EXPIRED ||
          subscription.status === SubscriptionStatus.CANCELLED
        ) {
          log.warn("Subscription not active", {
            orgId: auth.activeOrgId,
            status: subscription.status,
          });
          return PaymentRequiredResponse(
            "Subscription is not active. Please renew your subscription.",
            { status: subscription.status }
          );
        }

        // Check tier requirement
        if (config.requiredTier) {
          const hasRequiredTier =
            await subscriptionsService.checkTierRequirement(
              auth.activeOrgId,
              config.requiredTier
            );

          if (!hasRequiredTier) {
            log.warn("Tier requirement not met", {
              orgId: auth.activeOrgId,
              currentTier: subscription.tier,
              requiredTier: config.requiredTier,
            });
            return PaymentRequiredResponse(
              `This feature requires ${config.requiredTier} tier or higher. Please upgrade your subscription.`,
              {
                currentTier: subscription.tier,
                requiredTier: config.requiredTier,
              }
            );
          }
        }

        // Check feature access
        if (config.requiredFeature) {
          const hasAccess = await subscriptionsService.checkFeatureAccess(
            auth.activeOrgId,
            config.requiredFeature
          );

          if (!hasAccess) {
            log.warn("Feature access denied", {
              orgId: auth.activeOrgId,
              feature: config.requiredFeature,
              tier: subscription.tier,
            });
            return PaymentRequiredResponse(
              `Feature "${config.requiredFeature}" is not available in your current plan.`,
              {
                feature: config.requiredFeature,
                currentTier: subscription.tier,
              }
            );
          }
        }

        // Custom check
        if (config.customCheck) {
          const passesCustomCheck = await config.customCheck(subscription);

          if (!passesCustomCheck) {
            log.warn("Custom subscription check failed", {
              orgId: auth.activeOrgId,
            });
            return PaymentRequiredResponse(
              "Subscription requirements not met."
            );
          }
        }

        // Add subscription to props
        const newProps = {
          ...props,
          subscription,
        } as TProps & WithSubscriptionProps;

        log.debug("Subscription check passed", {
          orgId: auth.activeOrgId,
          tier: subscription.tier,
        });

        return handler(request, params, newProps);
      } catch (error) {
        log.error("Error in subscription check", {
          error,
          orgId: auth.activeOrgId,
        });

        return NextResponse.json(
          {
            error: "Internal Server Error",
            message: "Failed to verify subscription",
            statusCode: 500,
          },
          { status: 500 }
        );
      }
    };
  };
}
