/**
 * Project Query Configuration
 *
 * ============================================
 * API LAYER - Query Parsing Configuration
 * ============================================
 *
 * Configuration for UniversalQueryParser to enable advanced filtering,
 * sorting, and searching on Project entities.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/types (IProject for type checking)
 * ✅ CAN import: @/shared/utils/query.parser (query utilities)
 * ❌ CANNOT import: ../infrastructure/schema (database implementation)
 * ❌ CANNOT import: ../application/* (services, factories)
 *
 * This provides a type-safe, compile-time-validated configuration that ensures
 * all fields are accounted for (either as filterable or explicitly excluded).
 */

import { IProject } from "../domain/types";
import {
  StrictQueryParserConfig,
  FilterOperator,
  baseFilterableFields,
} from "@/shared/utils/query.parser";

/**
 * Fields excluded from direct filtering
 * These are complex nested objects or arrays that need special handling
 * Note: Using snake_case to match actual database schema
 */
type ExcludedProjectFields =
  | "product"
  | "icp"
  | "business_goals"
  | "brand_voice"
  | "marketing_assets"
  | "clients"
  | "research_metadata"
  | "created_by_propel_auth_org_id"
  | "is_deleted"
  | "deleted_at"
  | "deleted_by"
  | "created_by"
  | "updated_by";

/**
 * Project Query Parser Configuration
 *
 * Supports filtering by:
 * - Company fields (name, industry, stage, website)
 * - Revenue metrics (MRR, ARR)
 * - User ownership (user_id, organization_id)
 * - Audit fields (created_at, updated_at)
 *
 * Supports searching across:
 * - Company name and description
 * - Product description
 * - Website URL
 */
export const projectQueryConfig: StrictQueryParserConfig<
  IProject,
  ExcludedProjectFields
> = {
  searchFields: {
    textFields: [
      "company.name",
      "company.description",
      "product.description",
      "company.website",
    ],
    exactFields: ["company.website"],
  },

  filterableFields: {
    // Company fields
    "company.name": {
      field: "company.name",
      type: "string",
      operators: [
        FilterOperator.EQUALS,
        FilterOperator.CONTAINS,
        FilterOperator.STARTS_WITH,
      ],
      allowMultiple: false,
    },
    "company.industry": {
      field: "company.industry",
      type: "string",
      operators: [FilterOperator.EQUALS, FilterOperator.IN],
      allowMultiple: true,
    },
    "company.stage": {
      field: "company.stage",
      type: "string",
      operators: [FilterOperator.EQUALS, FilterOperator.IN],
      allowMultiple: true,
    },
    "company.website": {
      field: "company.website",
      type: "string",
      operators: [FilterOperator.EQUALS, FilterOperator.CONTAINS],
      allowMultiple: false,
    },
    "company.description": {
      field: "company.description",
      type: "string",
      operators: [FilterOperator.CONTAINS],
      allowMultiple: false,
    },

    // Revenue metrics (snake_case to match database schema)
    current_mrr: {
      field: "current_mrr",
      type: "number",
      operators: [
        FilterOperator.EQUALS,
        FilterOperator.GREATER_THAN,
        FilterOperator.GREATER_THAN_OR_EQUAL,
        FilterOperator.LESS_THAN,
        FilterOperator.LESS_THAN_OR_EQUAL,
      ],
      allowMultiple: false,
    },
    current_arr: {
      field: "current_arr",
      type: "number",
      operators: [
        FilterOperator.EQUALS,
        FilterOperator.GREATER_THAN,
        FilterOperator.GREATER_THAN_OR_EQUAL,
        FilterOperator.LESS_THAN,
        FilterOperator.LESS_THAN_OR_EQUAL,
      ],
      allowMultiple: false,
    },

    // User ownership (snake_case to match database schema)
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

    // Audit fields (inherited from base - already snake_case)
    ...baseFilterableFields,
  },

  // Explicitly excluded fields (snake_case to match database schema)
  excludedFields: [
    "product",
    "icp",
    "business_goals",
    "brand_voice",
    "marketing_assets",
    "clients",
    "research_metadata",
    "created_by_propel_auth_org_id",
    "is_deleted",
    "deleted_at",
    "deleted_by",
    "created_by",
    "updated_by",
  ],

  // Default query behavior (snake_case to match database schema)
  defaultSort: "-created_at", // Most recent first
  defaultPageSize: 20,
  maxPageSize: 100,
} as any;
