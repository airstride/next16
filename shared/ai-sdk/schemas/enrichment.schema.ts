import { z } from "zod";
import { EmployeeBand, PartnerCategory, Region, RevenueBand } from "@/types/enums";

const EmployeeBandEnum = Object.values(EmployeeBand);
const RevenueBandEnum = Object.values(RevenueBand);
const RegionEnum = Object.values(Region);
const PartnerCategoryEnum = Object.values(PartnerCategory);

/**
 * Partner profile enrichment response schema
 */
export const PartnerProfileEnrichmentSchema = z.object({
  company_profile: z
    .object({
      employee_band: z.enum(EmployeeBandEnum).nullable().optional(),
      revenue_band: z.enum(RevenueBandEnum).nullable().optional(),
      region: z.enum(RegionEnum).nullable().optional(),
    })
    .optional(),
  categories: z.array(z.enum(PartnerCategoryEnum)).optional(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

// Export the inferred type
export type PartnerProfileEnrichment = z.infer<typeof PartnerProfileEnrichmentSchema>;
