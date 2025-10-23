import { z } from "zod";

// Analysis confidence schema
const JointAnalysisConfidenceSchema = z.object({
  joint_value_proposition: z.enum(["HIGH", "MEDIUM", "LOW"]),
  key_synergies: z.enum(["HIGH", "MEDIUM", "LOW"]),
  market_analysis: z.enum(["HIGH", "MEDIUM", "LOW"]),
  go_to_market_strategy: z.enum(["HIGH", "MEDIUM", "LOW"]),
  overall_analysis_quality: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

// Main joint partnership analysis response schema
export const JointPartnershipAnalysisResponseSchema = z.object({
  joint_value_proposition: z.string(),
  key_synergies: z.array(z.string()),
  overlapping_target_markets: z.array(z.string()),
  joint_go_to_market_strategy: z.string(),
  competitive_advantages: z.array(z.string()),
  partnership_opportunities: z.array(z.string()),
  market_expansion_potential: z.string(),
  revenue_synergies: z.string(),
  integration_complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  partnership_readiness_score: z.number().min(1).max(10),
  analysis_confidence: JointAnalysisConfidenceSchema,
});

// Export the inferred type
export type JointPartnershipAnalysisResponse = z.infer<
  typeof JointPartnershipAnalysisResponseSchema
>;

// Export individual component types for flexibility
export type JointAnalysisConfidence = z.infer<typeof JointAnalysisConfidenceSchema>;
