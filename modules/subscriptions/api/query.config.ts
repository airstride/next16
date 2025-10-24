/**
 * Subscription Query Configuration
 *
 * ============================================
 * API LAYER - Query Parsing Configuration
 * ============================================
 *
 * Configuration for filtering, sorting, and searching subscriptions.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/types
 * ✅ CAN import: @/shared/utils/query.parser
 * ❌ CANNOT import: ../infrastructure/schema
 */

import { ISubscription } from "../domain/types";
import {
  StrictQueryParserConfig,
  FilterOperator,
  baseFilterableFields,
} from "@/shared/utils/query.parser";

/**
 * Excluded fields (complex or internal)
 */
type ExcludedSubscriptionFields = Exclude<
  keyof ISubscription,
  | "limits"
  | "usage"
  | "metadata"
  | "created_by_propel_auth_org_id"
  | "is_deleted"
  | "deleted_at"
  | "deleted_by"
  | "created_by"
  | "updated_by"
>;

/**
 * Subscription Query Parser Configuration
 *
 * Supports filtering by:
 * - PropelAuth org ID (exact match)
 * - Tier, status, billing cycle
 * - Trial dates
 * - Stripe IDs
 */
export const subscriptionQueryConfig: StrictQueryParserConfig<
  ISubscription,
  ExcludedSubscriptionFields
> = {
  searchFields: {
    textFields: [],
    exactFields: ["propel_auth_org_id", "stripe_customer_id"],
  },

  filterableFields: {
    // PropelAuth org ID
    propel_auth_org_id: {
      field: "propel_auth_org_id",
      type: "string",
      operators: [FilterOperator.EQUALS],
      allowMultiple: false,
    },

    // Subscription tier
    tier: {
      field: "tier",
      type: "string",
      operators: [FilterOperator.EQUALS, FilterOperator.IN],
      allowMultiple: true,
    },

    // Subscription status
    status: {
      field: "status",
      type: "string",
      operators: [FilterOperator.EQUALS, FilterOperator.IN],
      allowMultiple: true,
    },

    // Billing cycle
    billing_cycle: {
      field: "billing_cycle",
      type: "string",
      operators: [FilterOperator.EQUALS],
      allowMultiple: false,
    },

    // Trial dates
    trial_started_at: {
      field: "trial_started_at",
      type: "date",
      operators: [
        FilterOperator.EQUALS,
        FilterOperator.GREATER_THAN,
        FilterOperator.GREATER_THAN_OR_EQUAL,
        FilterOperator.LESS_THAN,
        FilterOperator.LESS_THAN_OR_EQUAL,
      ],
      allowMultiple: false,
    },
    trial_ends_at: {
      field: "trial_ends_at",
      type: "date",
      operators: [
        FilterOperator.EQUALS,
        FilterOperator.GREATER_THAN,
        FilterOperator.GREATER_THAN_OR_EQUAL,
        FilterOperator.LESS_THAN,
        FilterOperator.LESS_THAN_OR_EQUAL,
      ],
      allowMultiple: false,
    },

    // Payment provider
    stripe_customer_id: {
      field: "stripe_customer_id",
      type: "string",
      operators: [FilterOperator.EQUALS],
      allowMultiple: false,
    },
    stripe_subscription_id: {
      field: "stripe_subscription_id",
      type: "string",
      operators: [FilterOperator.EQUALS],
      allowMultiple: false,
    },

    // Period dates
    current_period_start: {
      field: "current_period_start",
      type: "date",
      operators: [
        FilterOperator.GREATER_THAN,
        FilterOperator.GREATER_THAN_OR_EQUAL,
        FilterOperator.LESS_THAN,
        FilterOperator.LESS_THAN_OR_EQUAL,
      ],
      allowMultiple: false,
    },
    current_period_end: {
      field: "current_period_end",
      type: "date",
      operators: [
        FilterOperator.GREATER_THAN,
        FilterOperator.GREATER_THAN_OR_EQUAL,
        FilterOperator.LESS_THAN,
        FilterOperator.LESS_THAN_OR_EQUAL,
      ],
      allowMultiple: false,
    },

    // Usage tracking
    usage_reset_at: {
      field: "usage_reset_at",
      type: "date",
      operators: [
        FilterOperator.GREATER_THAN,
        FilterOperator.GREATER_THAN_OR_EQUAL,
        FilterOperator.LESS_THAN,
        FilterOperator.LESS_THAN_OR_EQUAL,
      ],
      allowMultiple: false,
    },
    usage_period_start: {
      field: "usage_period_start",
      type: "date",
      operators: [
        FilterOperator.GREATER_THAN,
        FilterOperator.GREATER_THAN_OR_EQUAL,
        FilterOperator.LESS_THAN,
        FilterOperator.LESS_THAN_OR_EQUAL,
      ],
      allowMultiple: false,
    },

    // User ownership
    user_id: {
      field: "user_id",
      type: "string",
      operators: [FilterOperator.EQUALS, FilterOperator.IN],
      allowMultiple: true,
    },
    organization_id: {
      field: "organization_id",
      type: "string",
      operators: [FilterOperator.EQUALS, FilterOperator.IN],
      allowMultiple: true,
    },

    // Base audit fields
    ...baseFilterableFields,
  },

  excludedFields: [
    "limits",
    "usage",
    "metadata",
    "created_by_propel_auth_org_id",
    "is_deleted",
    "deleted_at",
    "deleted_by",
    "created_by",
    "updated_by",
  ],

  defaultSort: "-created_at",
  defaultPageSize: 20,
  maxPageSize: 100,
} as any;
