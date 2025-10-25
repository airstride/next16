/**
 * Clients Module - Schema Definitions (Zod)
 *
 * ============================================
 * SINGLE SOURCE OF TRUTH - ZOD SCHEMAS
 * ============================================
 *
 * This file defines the COMPLETE client structure using Zod schemas.
 * These schemas serve three purposes simultaneously:
 *
 * 1. **TypeScript Types** - Inferred via z.infer<>
 * 2. **Mongoose Schema** - Generated via zodToMongoose()
 * 3. **Runtime Validation** - Used in API routes for validation
 *
 * ARCHITECTURAL BENEFITS:
 * ✅ Define structure once, use everywhere
 * ✅ Zero duplication between types, schemas, validation
 * ✅ Compile-time type safety across all layers
 * ✅ Runtime validation at API boundaries
 * ✅ Single point of change for schema updates
 *
 * DEPENDENCIES:
 * ✅ CAN import: zod, enums from ./types
 * ❌ CANNOT import: mongoose, infrastructure, services
 *
 * WHO CAN IMPORT THIS:
 * ✅ domain/types.ts - For type inference
 * ✅ infrastructure/schema.ts - For Mongoose schema generation
 * ✅ api/validation.ts - For API validation
 * ✅ application/* - For business logic validation
 */

import { z } from "zod";
import {
  CompanyStageValues,
  EmployeeSizeValues,
  ResearchStatusValues,
  ResearchSourceValues,
  ResearchStatus,
  ResearchSource,
} from "./types";

// ============================================
// NESTED DOMAIN SCHEMAS
// ============================================

/**
 * Company information schema
 */
export const CompanySchema = z.object({
  name: z.string().min(1, "Company name is required").trim(),
  industry: z.string().trim().optional(),
  stage: z.enum(CompanyStageValues).optional(),
  website: z.string().url("Invalid website URL").trim(),
  description: z.string().trim().optional(),
});

/**
 * Product information schema
 */
export const ProductSchema = z.object({
  description: z.string().trim().optional(),
  features: z.array(z.string().trim()).optional().default([]),
  value_proposition: z.string().trim().optional(),
});

/**
 * Ideal Customer Profile (ICP) schema
 */
export const ICPSchema = z.object({
  description: z.string().trim().optional(),
  pain_points: z.array(z.string().trim()).optional().default([]),
  demographics: z.string().trim().optional(),
  target_company_size: z.string().trim().optional(),
  target_industries: z.array(z.string().trim()).optional().default([]),
});

/**
 * Business goals and targets schema
 */
export const BusinessGoalsSchema = z.object({
  traffic_target: z.number().nonnegative().optional(),
  leads_target: z.number().nonnegative().optional(),
  revenue_target: z.number().nonnegative().optional(),
  demo_target: z.number().nonnegative().optional(),
  other: z.array(z.string().trim()).optional().default([]),
});

/**
 * Brand voice and messaging guidelines schema
 */
export const BrandVoiceSchema = z.object({
  tone: z.string().trim().optional(),
  style: z.string().trim().optional(),
  keywords: z.array(z.string().trim()).optional().default([]),
  guidelines: z.string().trim().optional(),
});

/**
 * Marketing assets and social media URLs schema
 */
export const MarketingAssetsSchema = z.object({
  linkedin_url: z.string().url().trim().optional(),
  twitter_url: z.string().url().trim().optional(),
  facebook_url: z.string().url().trim().optional(),
  instagram_url: z.string().url().trim().optional(),
  blog_url: z.string().url().trim().optional(),
  youtube_url: z.string().url().trim().optional(),
  other_urls: z.array(z.string().url().trim()).optional().default([]),
});

/**
 * Existing Customer information schema (the company's clients/customers)
 */
export const ExistingCustomerSchema = z.object({
  name: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  contract_value: z.number().nonnegative().optional(),
  start_date: z.coerce.date().optional(),
});

/**
 * Competitor intelligence schema
 */
export const CompetitorSchema = z.object({
  name: z.string().min(1, "Competitor name is required").trim(),
  website: z.string().url().trim().optional(),
  positioning: z.string().trim().optional(),
  strengths: z.array(z.string().trim()).optional().default([]),
  weaknesses: z.array(z.string().trim()).optional().default([]),
  estimated_monthly_traffic: z.number().nonnegative().optional(),
  employee_size: z.enum(EmployeeSizeValues).optional(),
});

/**
 * Traffic source breakdown schema
 */
export const TrafficSourceSchema = z.object({
  source: z.string().trim(),
  percentage: z.number().min(0).max(100).optional(),
});

/**
 * Current performance metrics schema
 */
export const CurrentMetricsSchema = z.object({
  monthly_traffic: z.number().nonnegative().optional(),
  monthly_leads: z.number().nonnegative().optional(),
  conversion_rate: z.number().min(0).max(1).optional(),
  cac: z.number().nonnegative().optional(),
  ltv: z.number().nonnegative().optional(),
  top_pages: z.array(z.string().trim()).optional().default([]),
  top_keywords: z.array(z.string().trim()).optional().default([]),
  traffic_sources: z.array(TrafficSourceSchema).optional().default([]),
  bounce_rate: z.number().min(0).max(1).optional(),
  avg_session_duration: z.number().nonnegative().optional(),
});

/**
 * Content inventory snapshot schema
 */
export const ContentInventorySchema = z.object({
  total_blog_posts: z.number().nonnegative().optional(),
  total_case_studies: z.number().nonnegative().optional(),
  total_whitepapers: z.number().nonnegative().optional(),
  total_videos: z.number().nonnegative().optional(),
  total_podcasts: z.number().nonnegative().optional(),
  top_performing_content: z.array(z.string().trim()).optional().default([]),
  publishing_frequency: z.string().trim().optional(),
  last_published: z.coerce.date().optional(),
  content_themes: z.array(z.string().trim()).optional().default([]),
});

/**
 * Marketing technology stack schema
 */
export const TechStackSchema = z.object({
  cms: z.string().trim().optional(),
  analytics: z.array(z.string().trim()).optional().default([]),
  email_platform: z.string().trim().optional(),
  crm: z.string().trim().optional(),
  social_scheduling: z.string().trim().optional(),
  marketing_automation: z.string().trim().optional(),
  seo_tools: z.array(z.string().trim()).optional().default([]),
  other_tools: z.array(z.string().trim()).optional().default([]),
});

/**
 * Team and resource capacity schema
 */
export const ResourcesSchema = z.object({
  total_team_size: z.number().nonnegative().optional(),
  marketing_team_size: z.number().nonnegative().optional(),
  content_writers: z.number().nonnegative().optional(),
  has_in_house_design: z.boolean().optional(),
  has_in_house_dev: z.boolean().optional(),
  monthly_marketing_budget: z.number().nonnegative().optional(),
  paid_ad_budget: z.number().nonnegative().optional(),
  content_budget: z.number().nonnegative().optional(),
});

/**
 * Conversion funnel stages schema
 */
export const ConversionFunnelSchema = z.object({
  awareness_channels: z.array(z.string().trim()).optional().default([]),
  consideration_assets: z.array(z.string().trim()).optional().default([]),
  decision_triggers: z.array(z.string().trim()).optional().default([]),
  decision_maker_job_title: z.string().trim().optional(),
  primary_cta: z.string().trim().optional(),
  conversion_bottleneck: z.string().trim().optional(),
  avg_sales_cycle_days: z.number().nonnegative().optional(),
});

/**
 * Research metadata for AI-powered extraction schema
 */
export const ResearchMetadataSchema = z.object({
  status: z.enum(ResearchStatusValues).default(ResearchStatus.MANUAL),
  source: z.enum(ResearchSourceValues).default(ResearchSource.AI),
  researched_at: z.coerce.date().optional(),
  confidence: z.number().min(0).max(1).optional(),
  factual_confidence: z.number().min(0).max(1).optional(),
  inferred_confidence: z.number().min(0).max(1).optional(),
  research_notes: z.string().trim().optional(),
});

// ============================================
// COMPLETE CLIENT SCHEMA
// ============================================

/**
 * Complete Client Fields Schema (Domain-Specific Only)
 *
 * This schema defines ONLY the domain-specific fields.
 * Base entity fields (user_id, created_at, etc.) are added separately
 * at the infrastructure layer to maintain clean separation.
 *
 * TYPE INFERENCE:
 * - IClient = z.infer<typeof ClientFieldsSchema> & IEntity<DatabaseId>
 *
 * USAGE:
 * - Mongoose: zodToMongoose(ClientFieldsSchema) + baseUserEntityDefinition
 * - API Validation: Reuse nested schemas as needed
 * - TypeScript: z.infer<typeof ClientFieldsSchema>
 */
export const ClientFieldsSchema = z.object({
  // User ownership (required at infrastructure layer, not here)
  user_id: z.string().min(1),
  organization_id: z.string().optional(),

  // Core company context
  company: CompanySchema,
  product: ProductSchema.optional(),
  icp: ICPSchema.optional(),
  business_goals: BusinessGoalsSchema.optional(),
  brand_voice: BrandVoiceSchema.optional(),
  marketing_assets: MarketingAssetsSchema.optional(),

  // Existing customers and revenue data
  existing_customers: z.array(ExistingCustomerSchema).optional().default([]),
  current_mrr: z.number().nonnegative().optional(),
  current_arr: z.number().nonnegative().optional(),

  // Growth strategy intelligence
  competitors: z.array(CompetitorSchema).optional().default([]),
  current_metrics: CurrentMetricsSchema.optional(),
  content_inventory: ContentInventorySchema.optional(),
  tech_stack: TechStackSchema.optional(),
  resources: ResourcesSchema.optional(),
  conversion_funnel: ConversionFunnelSchema.optional(),

  // AI research metadata
  research_metadata: ResearchMetadataSchema,
});

/**
 * Infer TypeScript type from schema
 * This is the pure domain type without base entity fields
 */
export type ClientFields = z.infer<typeof ClientFieldsSchema>;
