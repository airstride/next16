/**
 * Clients Module - API Validation Schemas
 *
 * ============================================
 * API LAYER - Input/Output Validation
 * ============================================
 *
 * Defines Zod schemas for API request validation and response typing.
 *
 * ⚡ SCHEMA REUSE STRATEGY:
 * - Reuses domain Zod schemas from schema.definition.ts
 * - Eliminates duplication between domain and API validation
 * - Ensures API validation stays in sync with domain structure
 * - Single source of truth for all validation rules
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/schema.definition (Zod schemas)
 * ✅ CAN import: ../domain/types (enums for validation)
 * ✅ CAN import: @/shared/validation (base validation utilities)
 * ✅ CAN import: zod (validation library)
 * ❌ CANNOT import: ../infrastructure/schema (database types)
 * ❌ CANNOT import: ../application/* (services, factories)
 */

import { z } from "zod";
import {
  CompanySchema,
  ProductSchema,
  ICPSchema,
  BusinessGoalsSchema,
  BrandVoiceSchema,
  MarketingAssetsSchema,
  ExistingCustomerSchema,
  CompetitorSchema,
  CurrentMetricsSchema,
  ContentInventorySchema,
  TechStackSchema,
  ResourcesSchema,
  ConversionFunnelSchema,
} from "../domain/schema.definition";
import {
  createResponseSchema,
  createInputSchema,
} from "@/shared/validation/base.validation";
import { BrandedZodType } from "@/shared/types";

/**
 * ============================================================================
 * Brand Symbols for Nominal Typing
 * ============================================================================
 */

export const WebsiteUrlInputBrand = Symbol("WebsiteUrlInputBrand");
export const CreateClientBrand = Symbol("CreateClientBrand");
export const UpdateClientBrand = Symbol("UpdateClientBrand");
export const RefineContextBrand = Symbol("RefineContextBrand");

/**
 * ============================================================================
 * Input Validation Schemas (snake_case for API/JSON)
 * ============================================================================
 */

/**
 * Website URL input for API request validation (from client)
 * Only validates the website_url from the request body
 */
export const WebsiteUrlInputSchema = z.object({
  website_url: z
    .url("Invalid website URL format")
    .min(1, "Website URL is required"),
});

/**
 * Internal type used by service layer (includes auth context)
 * Not used for API validation - constructed by service
 */
export type WebsiteUrlInput = BrandedZodType<
  {
    website_url: string;
    user_id: string;
    organization_id?: string;
  },
  typeof WebsiteUrlInputBrand
>;

/**
 * ============================================================================
 * AI-Extracted Context Schema (Structured Output from AI)
 * ============================================================================
 *
 * ⚡ SCHEMA REUSE: Uses domain schemas directly instead of duplicating
 * This was previously 150+ lines of duplicated schema definitions.
 * Now it's just composition of existing schemas!
 */

export const AIExtractedContextSchema = z.object({
  // Reuse domain schemas directly - zero duplication!
  company: CompanySchema.omit({ website: true }).extend({
    // Website not required for AI extraction (might extract from URL)
  }),
  product: ProductSchema.optional(),
  icp: ICPSchema.optional(),
  business_goals: BusinessGoalsSchema.optional(),
  brand_voice: BrandVoiceSchema.optional(),
  marketing_assets: MarketingAssetsSchema.optional(),

  // Growth strategy intelligence - reuse domain schemas
  competitors: z.array(CompetitorSchema).optional().default([]),
  current_metrics: CurrentMetricsSchema.optional(),
  content_inventory: ContentInventorySchema.optional(),
  tech_stack: TechStackSchema.optional(),
  resources: ResourcesSchema.optional(),
  conversion_funnel: ConversionFunnelSchema.optional(),

  // AI confidence metrics (specific to AI extraction, not in domain)
  confidence: z.object({
    overall: z
      .number()
      .min(0, "Confidence must be between 0 and 1")
      .max(1, "Confidence must be between 0 and 1"),
    factual: z
      .number()
      .min(0, "Factual confidence must be between 0 and 1")
      .max(1, "Factual confidence must be between 0 and 1"),
    inferred: z
      .number()
      .min(0, "Inferred confidence must be between 0 and 1")
      .max(1, "Inferred confidence must be between 0 and 1"),
  }),

  research_notes: z.string().optional(),
});

export type AIExtractedContext = z.infer<typeof AIExtractedContextSchema>;

/**
 * ============================================================================
 * Manual Client Creation Schema
 * ============================================================================
 *
 * ⚡ SCHEMA REUSE: Composes domain schemas instead of duplicating
 * This was previously 70+ lines of duplicated schema definitions.
 * Now it's just composition of existing schemas!
 */

// Client-specific fields (without user_id/organization_id - added by helper)
const ClientFieldsSchema = z.object({
  // Reuse domain schemas directly
  company: CompanySchema,
  product: ProductSchema.optional(),
  icp: ICPSchema.optional(),
  business_goals: BusinessGoalsSchema.optional(),
  brand_voice: BrandVoiceSchema.optional(),
  marketing_assets: MarketingAssetsSchema.optional(),
  existing_customers: z.array(ExistingCustomerSchema).optional(),
  current_mrr: z.number().nonnegative().optional(),
  current_arr: z.number().nonnegative().optional(),
});

// Use helper to add user_id and organization_id
export const CreateClientSchema = createInputSchema(ClientFieldsSchema);

export type CreateClientInput = BrandedZodType<
  z.infer<typeof CreateClientSchema>,
  typeof CreateClientBrand
>;

/**
 * ============================================================================
 * Update Client Schema (Partial Updates)
 * ============================================================================
 */

export const UpdateClientSchema = CreateClientSchema.partial().omit({
  user_id: true,
});

export type UpdateClientInput = BrandedZodType<
  z.infer<typeof UpdateClientSchema>,
  typeof UpdateClientBrand
>;

/**
 * ============================================================================
 * Refine Context Schema (User overrides AI-extracted data)
 * ============================================================================
 *
 * ⚡ SCHEMA REUSE: Makes all domain schemas partial for refinement
 * This was previously 60+ lines of duplicated partial schema definitions.
 * Now it's just making the existing schemas partial!
 */

export const RefineContextSchema = z.object({
  // Reuse domain schemas with .partial() to make all fields optional for refinement
  company: CompanySchema.partial().optional(),
  product: ProductSchema.partial().optional(),
  icp: ICPSchema.partial().optional(),
  business_goals: BusinessGoalsSchema.partial().optional(),
  brand_voice: BrandVoiceSchema.partial().optional(),
  marketing_assets: MarketingAssetsSchema.partial().optional(),

  refinement_notes: z.string().optional(),
});

export type RefineContextInput = BrandedZodType<
  z.infer<typeof RefineContextSchema>,
  typeof RefineContextBrand
>;

/**
 * ============================================================================
 * Response Schemas
 * ============================================================================
 *
 * ⚡ SCHEMA REUSE: Composes domain schemas for API responses
 * This was previously 65+ lines of duplicated response schema definitions.
 * Now it's just composition of existing schemas!
 */

/**
 * Client-specific response fields (without base audit fields)
 */
const ClientResponseFieldsSchema = z.object({
  // Reuse domain schemas directly - they already match the response shape
  company: CompanySchema,
  product: ProductSchema,
  icp: ICPSchema,
  business_goals: BusinessGoalsSchema,
  brand_voice: BrandVoiceSchema,
  marketing_assets: MarketingAssetsSchema,
  existing_customers: z.array(ExistingCustomerSchema).optional(),
  current_mrr: z.number().optional(),
  current_arr: z.number().optional(),

  // Growth strategy fields
  competitors: z.array(CompetitorSchema).optional(),
  current_metrics: CurrentMetricsSchema.optional(),
  content_inventory: ContentInventorySchema.optional(),
  tech_stack: TechStackSchema.optional(),
  resources: ResourcesSchema.optional(),
  conversion_funnel: ConversionFunnelSchema.optional(),

  // Research metadata (transform for response)
  research_metadata: z.object({
    status: z.string(),
    source: z.string(),
    researched_at: z.date().optional(),
    confidence: z.number().optional(),
    factual_confidence: z.number().optional(),
    inferred_confidence: z.number().optional(),
    research_notes: z.string().optional(),
  }),
});

/**
 * Client response schema (extends base - automatically includes id, audit fields, user ownership)
 */
export const ClientResponseSchema = createResponseSchema(
  ClientResponseFieldsSchema
);

export type ClientResponse = z.infer<typeof ClientResponseSchema>;

/**
 * Research result response schema
 */
export const ResearchResultResponseSchema = z.object({
  extracted_context: AIExtractedContextSchema,
  website_url: z.string().url(),
  researched_at: z.date(),
  success: z.boolean(),
  message: z.string().optional(),
});

export type ResearchResultResponse = z.infer<
  typeof ResearchResultResponseSchema
>;
