/**
 * Projects Module - API Validation Schemas
 *
 * ============================================
 * API LAYER - Input/Output Validation
 * ============================================
 *
 * Defines Zod schemas for API request validation and response typing.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/types (enums for validation)
 * ✅ CAN import: @/shared/validation (base validation utilities)
 * ✅ CAN import: zod (validation library)
 * ❌ CANNOT import: ../infrastructure/schema (database types)
 * ❌ CANNOT import: ../application/* (services, factories)
 * ❌ CANNOT import: ../domain/types IProject (validation defines API contract, not domain)
 */

import { z } from "zod";
import { CompanyStageValues } from "../domain/types";
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
export const CreateProjectBrand = Symbol("CreateProjectBrand");
export const UpdateProjectBrand = Symbol("UpdateProjectBrand");
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
 */

export const AIExtractedContextSchema = z.object({
  company: z.object({
    name: z.string().min(1, "Company name is required"),
    industry: z.string().optional(),
    stage: z.enum(CompanyStageValues).optional(),
    description: z.string().optional(),
  }),

  product: z.object({
    description: z.string().optional(),
    features: z.array(z.string()).optional().default([]),
    value_proposition: z.string().optional(),
  }),

  icp: z.object({
    description: z.string().optional(),
    pain_points: z.array(z.string()).optional().default([]),
    demographics: z.string().optional(),
    target_company_size: z.string().optional(),
    target_industries: z.array(z.string()).optional().default([]),
  }),

  business_goals: z.object({
    traffic_target: z.number().nonnegative().optional(),
    leads_target: z.number().nonnegative().optional(),
    revenue_target: z.number().nonnegative().optional(),
    demo_target: z.number().nonnegative().optional(),
    other: z.array(z.string()).optional().default([]),
  }),

  brand_voice: z.object({
    tone: z.string().optional(),
    style: z.string().optional(),
    keywords: z.array(z.string()).optional().default([]),
    guidelines: z.string().optional(),
  }),

  marketing_assets: z.object({
    linkedin_url: z.string().url().optional(),
    twitter_url: z.string().url().optional(),
    facebook_url: z.string().url().optional(),
    instagram_url: z.string().url().optional(),
    blog_url: z.string().url().optional(),
    youtube_url: z.string().url().optional(),
    other_urls: z.array(z.string().url()).optional().default([]),
  }),

  // Growth strategy intelligence
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        website: z.string().url().optional(),
        positioning: z.string().optional(),
        strengths: z.array(z.string()).optional().default([]),
        weaknesses: z.array(z.string()).optional().default([]),
        estimated_monthly_traffic: z.number().nonnegative().optional(),
      })
    )
    .optional()
    .default([]),

  current_metrics: z
    .object({
      monthly_traffic: z.number().nonnegative().optional(),
      monthly_leads: z.number().nonnegative().optional(),
      conversion_rate: z.number().min(0).max(1).optional(),
      cac: z.number().nonnegative().optional(),
      ltv: z.number().nonnegative().optional(),
      top_pages: z.array(z.string()).optional().default([]),
      top_keywords: z.array(z.string()).optional().default([]),
      traffic_sources: z
        .array(
          z.object({
            source: z.string(),
            percentage: z.number().min(0).max(100).optional(),
          })
        )
        .optional()
        .default([]),
      bounce_rate: z.number().min(0).max(1).optional(),
      avg_session_duration: z.number().nonnegative().optional(),
    })
    .optional(),

  content_inventory: z
    .object({
      total_blog_posts: z.number().nonnegative().optional(),
      total_case_studies: z.number().nonnegative().optional(),
      total_whitepapers: z.number().nonnegative().optional(),
      total_videos: z.number().nonnegative().optional(),
      total_podcasts: z.number().nonnegative().optional(),
      top_performing_content: z.array(z.string()).optional().default([]),
      publishing_frequency: z.string().optional(),
      last_published: z.coerce.date().optional(),
      content_themes: z.array(z.string()).optional().default([]),
    })
    .optional(),

  tech_stack: z
    .object({
      cms: z.string().optional(),
      analytics: z.array(z.string()).optional().default([]),
      email_platform: z.string().optional(),
      crm: z.string().optional(),
      social_scheduling: z.string().optional(),
      marketing_automation: z.string().optional(),
      seo_tools: z.array(z.string()).optional().default([]),
      other_tools: z.array(z.string()).optional().default([]),
    })
    .optional(),

  resources: z
    .object({
      total_team_size: z.number().nonnegative().optional(),
      marketing_team_size: z.number().nonnegative().optional(),
      content_writers: z.number().nonnegative().optional(),
      has_in_house_design: z.boolean().optional(),
      has_in_house_dev: z.boolean().optional(),
      monthly_marketing_budget: z.number().nonnegative().optional(),
      paid_ad_budget: z.number().nonnegative().optional(),
      content_budget: z.number().nonnegative().optional(),
    })
    .optional(),

  conversion_funnel: z
    .object({
      awareness_channels: z.array(z.string()).optional().default([]),
      consideration_assets: z.array(z.string()).optional().default([]),
      decision_triggers: z.array(z.string()).optional().default([]),
      primary_cta: z.string().optional(),
      conversion_bottleneck: z.string().optional(),
      avg_sales_cycle_days: z.number().nonnegative().optional(),
    })
    .optional(),

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
 * Manual Project Creation Schema
 * ============================================================================
 */

// Project-specific fields (without user_id/organization_id - added by helper)
const ProjectFieldsSchema = z.object({
  company: z.object({
    name: z.string().min(1, "Company name is required"),
    industry: z.string().optional(),
    stage: z.enum(CompanyStageValues as [string, ...string[]]).optional(),
    website: z.string().url("Invalid website URL"),
    description: z.string().optional(),
  }),

  product: z
    .object({
      description: z.string().optional(),
      features: z.array(z.string()).optional(),
      value_proposition: z.string().optional(),
    })
    .optional(),

  icp: z
    .object({
      description: z.string().optional(),
      pain_points: z.array(z.string()).optional(),
      demographics: z.string().optional(),
      target_company_size: z.string().optional(),
      target_industries: z.array(z.string()).optional(),
    })
    .optional(),

  business_goals: z
    .object({
      traffic_target: z.number().nonnegative().optional(),
      leads_target: z.number().nonnegative().optional(),
      revenue_target: z.number().nonnegative().optional(),
      demo_target: z.number().nonnegative().optional(),
      other: z.array(z.string()).optional(),
    })
    .optional(),

  brand_voice: z
    .object({
      tone: z.string().optional(),
      style: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      guidelines: z.string().optional(),
    })
    .optional(),

  marketing_assets: z
    .object({
      linkedin_url: z.string().url().optional(),
      twitter_url: z.string().url().optional(),
      facebook_url: z.string().url().optional(),
      instagram_url: z.string().url().optional(),
      blog_url: z.string().url().optional(),
      youtube_url: z.string().url().optional(),
      other_urls: z.array(z.string().url()).optional(),
    })
    .optional(),

  clients: z
    .array(
      z.object({
        name: z.string().optional(),
        industry: z.string().optional(),
        contract_value: z.number().nonnegative().optional(),
        start_date: z.coerce.date().optional(),
      })
    )
    .optional(),

  current_mrr: z.number().nonnegative().optional(),
  current_arr: z.number().nonnegative().optional(),
});

// Use helper to add user_id and organization_id
export const CreateProjectSchema = createInputSchema(ProjectFieldsSchema);

export type CreateProjectInput = BrandedZodType<
  z.infer<typeof CreateProjectSchema>,
  typeof CreateProjectBrand
>;

/**
 * ============================================================================
 * Update Project Schema (Partial Updates)
 * ============================================================================
 */

export const UpdateProjectSchema = CreateProjectSchema.partial().omit({
  user_id: true,
});

export type UpdateProjectInput = BrandedZodType<
  z.infer<typeof UpdateProjectSchema>,
  typeof UpdateProjectBrand
>;

/**
 * ============================================================================
 * Refine Context Schema (User overrides AI-extracted data)
 * ============================================================================
 */

export const RefineContextSchema = z.object({
  company: z
    .object({
      name: z.string().min(1).optional(),
      industry: z.string().optional(),
      stage: z.enum(CompanyStageValues as [string, ...string[]]).optional(),
      description: z.string().optional(),
    })
    .optional(),

  product: z
    .object({
      description: z.string().optional(),
      features: z.array(z.string()).optional(),
      value_proposition: z.string().optional(),
    })
    .optional(),

  icp: z
    .object({
      description: z.string().optional(),
      pain_points: z.array(z.string()).optional(),
      demographics: z.string().optional(),
      target_company_size: z.string().optional(),
      target_industries: z.array(z.string()).optional(),
    })
    .optional(),

  business_goals: z
    .object({
      traffic_target: z.number().nonnegative().optional(),
      leads_target: z.number().nonnegative().optional(),
      revenue_target: z.number().nonnegative().optional(),
      demo_target: z.number().nonnegative().optional(),
      other: z.array(z.string()).optional(),
    })
    .optional(),

  brand_voice: z
    .object({
      tone: z.string().optional(),
      style: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      guidelines: z.string().optional(),
    })
    .optional(),

  marketing_assets: z
    .object({
      linkedin_url: z.string().url().optional(),
      twitter_url: z.string().url().optional(),
      facebook_url: z.string().url().optional(),
      instagram_url: z.string().url().optional(),
      blog_url: z.string().url().optional(),
      youtube_url: z.string().url().optional(),
      other_urls: z.array(z.string().url()).optional(),
    })
    .optional(),

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
 */

/**
 * Project-specific response fields (without base audit fields)
 */
const ProjectResponseFieldsSchema = z.object({
  company: z.object({
    name: z.string(),
    industry: z.string().optional(),
    stage: z.string().optional(),
    website: z.string(),
    description: z.string().optional(),
  }),
  product: z.object({
    description: z.string().optional(),
    features: z.array(z.string()).optional(),
    value_proposition: z.string().optional(),
  }),
  icp: z.object({
    description: z.string().optional(),
    pain_points: z.array(z.string()).optional(),
    demographics: z.string().optional(),
    target_company_size: z.string().optional(),
    target_industries: z.array(z.string()).optional(),
  }),
  business_goals: z.object({
    traffic_target: z.number().optional(),
    leads_target: z.number().optional(),
    revenue_target: z.number().optional(),
    demo_target: z.number().optional(),
    other: z.array(z.string()).optional(),
  }),
  brand_voice: z.object({
    tone: z.string().optional(),
    style: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    guidelines: z.string().optional(),
  }),
  marketing_assets: z.object({
    linkedin_url: z.string().optional(),
    twitter_url: z.string().optional(),
    facebook_url: z.string().optional(),
    instagram_url: z.string().optional(),
    blog_url: z.string().optional(),
    youtube_url: z.string().optional(),
    other_urls: z.array(z.string()).optional(),
  }),
  clients: z
    .array(
      z.object({
        name: z.string().optional(),
        industry: z.string().optional(),
        contract_value: z.number().optional(),
        start_date: z.date().optional(),
      })
    )
    .optional(),
  current_mrr: z.number().optional(),
  current_arr: z.number().optional(),
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
 * Project response schema (extends base - automatically includes id, audit fields, user ownership)
 */
export const ProjectResponseSchema = createResponseSchema(
  ProjectResponseFieldsSchema
);

export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;

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
