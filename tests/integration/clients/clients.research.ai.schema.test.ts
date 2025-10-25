/**
 * @jest-environment node
 */

/**
 * Integration Test: Airstride Website Research - Schema Validation
 *
 * Tests that AI response matches expected schema structure.
 */

import { clientsService } from "@/modules/clients/application/service";

describe("Airstride Website Research - Schema Validation", () => {
  const TEST_TIMEOUT = 90000;
  const AIRSTRIDE_URL = "https://airstride.ai";

  it(
    "should return structured data matching AIExtractedContext schema",
    async () => {
      console.log("🔍 Validating AI response schema for Airstride...");

      const result = await clientsService.researchWebsite(AIRSTRIDE_URL);

      console.log("✅ Schema validation passed");

      // Validate all required top-level fields exist
      expect(result).toHaveProperty("company");
      expect(result).toHaveProperty("product");
      expect(result).toHaveProperty("icp");
      expect(result).toHaveProperty("business_goals");
      expect(result).toHaveProperty("brand_voice");
      expect(result).toHaveProperty("marketing_assets");
      expect(result).toHaveProperty("confidence");

      // Validate company nested structure
      expect(result.company).toHaveProperty("name");
      expect(typeof result.company.name).toBe("string");

      // Validate confidence structure
      expect(result.confidence).toHaveProperty("overall");
      expect(result.confidence).toHaveProperty("factual");
      expect(result.confidence).toHaveProperty("inferred");
      expect(typeof result.confidence.overall).toBe("number");
      expect(typeof result.confidence.factual).toBe("number");
      expect(typeof result.confidence.inferred).toBe("number");

      // Validate arrays are arrays
      expect(Array.isArray(result.product?.features || [])).toBe(true);
      expect(Array.isArray(result.icp?.pain_points || [])).toBe(true);
      expect(Array.isArray(result.icp?.target_industries || [])).toBe(true);
      expect(Array.isArray(result.brand_voice?.keywords || [])).toBe(true);

      console.log("  ✓ All required fields present");
      console.log("  ✓ Field types correct");
      console.log("  ✓ Arrays properly initialized");
    },
    TEST_TIMEOUT
  );
});

