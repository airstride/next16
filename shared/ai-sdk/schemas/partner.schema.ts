import { z } from "zod";
import {
  CompanySize,
  EmployeeBand,
  GrowthStage,
  PartnerResearchStatus,
  Priority,
  Region,
  RevenueBand,
} from "@/types/enums";

const PartnerResearchStatusValues = Object.values(PartnerResearchStatus);
const EmployeeBandEnum = Object.values(EmployeeBand);
const RevenueBandEnum = Object.values(RevenueBand);
const GrowthStageEnum = Object.values(GrowthStage);
const RegionEnum = Object.values(Region);
const CompanySizeEnum = Object.values(CompanySize);
const PriorityEnum = Object.values(Priority);

// Company profile schema
const CompanyProfileSchema = z.object({
  company_name: z.string(),
  website: z.string(),
  industry: z.string(),
  business_model: z.string(),
  company_size: z.enum(CompanySizeEnum),
  employee_band: z.enum(EmployeeBandEnum).optional(),
  revenue_band: z.enum(RevenueBandEnum).optional(),
  headquarters: z.string().optional(),
  city: z.string().optional(),
  logo_url: z.url().optional(),
  founded: z.string().optional(),
  growth_stage: z.enum(GrowthStageEnum),
  region: z.enum(RegionEnum).optional(),
});

// Research confidence schema - updated to match actual OpenAI response
const ResearchConfidenceSchema = z.object({
  overall_data_quality: z.enum(PriorityEnum),
  partnership_intelligence: z.enum(PriorityEnum),
  completeness_score: z.string(), // e.g., "8/12" or "83%"
});

// Strategic insights schema - updated to match actual OpenAI response
const StrategicInsightsSchema = z.object({
  partnership_readiness: z.string(),
  competitive_advantages: z.string(),
  market_position: z.string(),
  growth_indicators: z.string(),
});

// Product schema - updated to include category
const ProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string().optional(),
});

// Finding schema for detailed error responses
const FindingSchema = z.object({
  type: z.string(), // e.g., "Website Mismatch", "Domain Investigation", etc.
  details: z.string(), // Specific details about what was found or not found
  source: z.string().optional(), // Source name (e.g., "Better Business Bureau")
  status: z.string().optional(), // e.g., "Profile Found, Not Verified", "Inactive"
  url: z.string().optional(), // URL if applicable
  domain: z.string().optional(), // Domain name if applicable
});

// Error response schema for when AI can't find or verify company
const PartnerResearchErrorSchema = z.object({
  companyName: z.string(), // Company name from input
  status: z.enum(PartnerResearchStatusValues), // Verification status
  conclusion: z.string(), // Comprehensive summary of why company couldn't be verified
  researchSummary: z.string(), // Detailed explanation of search attempts
  searchedLocation: z.string().optional(), // Location from input or discovered
  findings: z.array(FindingSchema), // Array of verification attempts and results
});

// Success response schema - updated to match actual OpenAI response
const PartnerResearchSuccessSchema = z.object({
  company_profile: CompanyProfileSchema,
  categories: z.array(z.string()).optional(),
  description: z.string(),
  partnership_intelligence: z.record(z.any(), z.any()).optional(), // Dynamic object structure
  products: z.array(ProductSchema),
  strategic_insights: StrategicInsightsSchema,
  research_confidence: ResearchConfidenceSchema,
});

// Main partner research response schema - union of success and error responses
export const PartnerResearchResponseSchema = z.union([
  PartnerResearchSuccessSchema,
  PartnerResearchErrorSchema,
]);

// Export the inferred type
export type PartnerResearchResponse = z.infer<typeof PartnerResearchResponseSchema>;
export type PartnerResearchSuccess = z.infer<typeof PartnerResearchSuccessSchema>;
export type PartnerResearchError = z.infer<typeof PartnerResearchErrorSchema>;
export type Finding = z.infer<typeof FindingSchema>;

// Export individual component types for flexibility
export type Product = z.infer<typeof ProductSchema>;
export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;
export type ResearchConfidence = z.infer<typeof ResearchConfidenceSchema>;
export type StrategicInsights = z.infer<typeof StrategicInsightsSchema>;

// Type guard to check if response is an error
export const isPartnerResearchError = (
  response: PartnerResearchResponse
): response is PartnerResearchError => {
  return (
    "status" in response &&
    (response.status === PartnerResearchStatus.UNVERIFIED ||
      response.status === PartnerResearchStatus.POSSIBLY_DEFUNCT ||
      response.status === PartnerResearchStatus.NOT_FOUND)
  );
};
