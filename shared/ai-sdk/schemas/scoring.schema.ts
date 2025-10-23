import { z } from "zod";
import { ScoringCriteria } from "@/types/enums";

const ScoringCriteriaEnum = Object.keys(ScoringCriteria) as [string, ...string[]];

/**
 * Individual criterion score schema
 */
export const CriterionScoreSchema = z.object({
  criterion: z.enum(ScoringCriteriaEnum),
  score: z.number().min(0),
  max_points: z.number(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()),
  reasoning: z.string(),
});

/**
 * Overall assessment schema
 */
export const OverallAssessmentSchema = z.object({
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  strategic_fit_summary: z.string(),
  recommendation: z.string(),
});

/**
 * Scoring metadata schema
 */
export const ScoringMetadataSchema = z.object({
  scoring_date: z.string(),
  scoring_version: z.string(),
  data_source: z.string(),
  vendor_criteria_applied: z.object({
    target_regions: z.array(z.string()),
    target_industries: z.array(z.string()),
    tech_stack_keywords: z.array(z.string()),
  }),
  partner_data_confidence: z
    .object({
      overall_data_quality: z.string(),
      partnership_intelligence: z.string(),
      completeness_score: z.string(),
    })
    .optional(),
});

/**
 * Main partner scoring response schema
 */
export const PartnerScoringResponseSchema = z.object({
  partner_name: z.string(),
  vendor_name: z.string(),
  total_score: z.number(),
  fit_tier: z.enum(["GOLD", "SILVER", "BRONZE", "NOT_A_MATCH"]),
  criterion_scores: z.array(CriterionScoreSchema),
  overall_assessment: OverallAssessmentSchema,
  scoring_metadata: ScoringMetadataSchema,
});

// Export the inferred types
export type PartnerScoringResponse = z.infer<typeof PartnerScoringResponseSchema>;
export type CriterionScore = z.infer<typeof CriterionScoreSchema>;
export type OverallAssessment = z.infer<typeof OverallAssessmentSchema>;
export type ScoringMetadata = z.infer<typeof ScoringMetadataSchema>;
