import { z } from "zod";
import { CompanySize, GrowthStage, Priority, ProductCategory, Region } from "@/types/enums";

const GrowthStageEnum = Object.values(GrowthStage);
const RegionEnum = Object.values(Region);
const CompanySizeEnum = Object.values(CompanySize);
const PriorityEnum = Object.values(Priority);
const ProductCategoryEnum = Object.values(ProductCategory);

// Vendor profile information
export const VendorProfileSchema = z.object({
  company_name: z.string(),
  website: z.url(),
  company_email: z.email().optional(),
  industry: z.string(),
  company_size: z.enum(CompanySizeEnum),
  headquarters: z.string().optional(),
  logo_url: z.url().optional(),
  founded: z.string().optional(),
  region: z.enum(RegionEnum).optional(),
});

// Research confidence levels
export const ResearchConfidenceSchema = z.object({
  description: z.enum(PriorityEnum),
  products: z.enum(PriorityEnum),
  focused_regions: z.enum(PriorityEnum),
  target_industries: z.enum(PriorityEnum),
  tech_stack_keywords: z.enum(PriorityEnum),
  overall_data_quality: z.enum(PriorityEnum),
});

// Additional insights
export const AdditionalInsightsSchema = z.object({
  recent_developments: z.string().optional(),
  competitive_positioning: z.string().optional(),
  growth_stage: z.enum(GrowthStageEnum).optional(),
});

// Product schema
export const ProductSchema = z.object({
  name: z.string(),
  description: z.string(),
});

// Validation status schema
export const ValidationStatusSchema = z.object({
  is_valid: z.boolean(),
  reason: z.string().optional(),
});

// Main vendor research response schema
export const VendorResearchResponseSchema = z.object({
  validation_status: ValidationStatusSchema,
  company_profile: VendorProfileSchema,
  description: z.string(),
  products: z.array(ProductSchema),
  focused_regions: z.array(z.string()),
  target_industries: z.array(z.string()),
  tech_stack_keywords: z.array(z.string()),
  product_categories: z.array(z.enum(ProductCategoryEnum)),
  research_confidence: ResearchConfidenceSchema,
  additional_insights: AdditionalInsightsSchema,
});

// TypeScript types derived from schemas
export type Product = z.infer<typeof ProductSchema>;
export type VendorProfile = z.infer<typeof VendorProfileSchema>;
export type ResearchConfidence = z.infer<typeof ResearchConfidenceSchema>;
export type AdditionalInsights = z.infer<typeof AdditionalInsightsSchema>;
export type ValidationStatus = z.infer<typeof ValidationStatusSchema>;
export type VendorResearchResponse = z.infer<typeof VendorResearchResponseSchema>;
