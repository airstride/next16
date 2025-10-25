/**
 * @jest-environment node
 */

/**
 * Integration Test: Airstride Website Research - Basic Functionality
 *
 * Tests basic AI-powered website research functionality for Airstride.
 */

import { clientsService } from "@/modules/clients/application/service";

describe("Airstride Website Research - Basic", () => {
  const TEST_TIMEOUT = 90000;
  const AIRSTRIDE_URL = "https://airstride.ai";

  it(
    "should successfully research airstride.ai and extract company context",
    async () => {
      console.log("🔍 Starting website research test for Airstride...");
      console.log(`  Website: ${AIRSTRIDE_URL}`);

      const startTime = Date.now();
      const result = await clientsService.researchWebsite(AIRSTRIDE_URL);
      const duration = Date.now() - startTime;

      console.log(`✅ Research completed in ${(duration / 1000).toFixed(2)}s`);
      console.log(`  Company name: ${result.company.name}`);
      console.log(`  Industry: ${result.company.industry || "N/A"}`);
      console.log(`  Stage: ${result.company.stage || "N/A"}`);
      console.log(
        `  Products: ${result.product?.features?.length || 0} features`
      );
      console.log(
        `  ICP target industries: ${
          result.icp?.target_industries?.length || 0
        }`
      );
      console.log(`  Overall confidence: ${result.confidence.overall}`);
      console.log(`  Factual confidence: ${result.confidence.factual}`);
      console.log(`  Inferred confidence: ${result.confidence.inferred}`);

      // Validate response structure
      expect(result).toBeDefined();
      expect(result.company).toBeDefined();
      expect(result.company.name).toBeDefined();
      expect(result.company.name.length).toBeGreaterThan(0);

      // Validate product information
      if (result.product) {
        expect(result.product.description).toBeDefined();
      }

      // Validate ICP
      expect(result.icp).toBeDefined();

      // Validate confidence scores
      expect(result.confidence).toBeDefined();
      expect(result.confidence.overall).toBeGreaterThanOrEqual(0);
      expect(result.confidence.overall).toBeLessThanOrEqual(1);
      expect(result.confidence.factual).toBeGreaterThanOrEqual(0);
      expect(result.confidence.factual).toBeLessThanOrEqual(1);
      expect(result.confidence.inferred).toBeGreaterThanOrEqual(0);
      expect(result.confidence.inferred).toBeLessThanOrEqual(1);

      // Verify response completed within acceptable time
      expect(duration).toBeLessThan(TEST_TIMEOUT);

      // Log performance warning if needed
      if (duration > 60000) {
        console.warn(
          `⚠️  Warning: Request took ${(duration / 1000).toFixed(
            2
          )}s (expected <60s)`
        );
      }

      // Log research notes if available
      if (result.research_notes) {
        console.log(
          `  Research notes: ${result.research_notes.substring(0, 100)}...`
        );
      }
    },
    TEST_TIMEOUT
  );

  it(
    "should provide confidence scoring for Airstride",
    async () => {
      console.log("🔍 Testing confidence scoring for Airstride...");

      const result = await clientsService.researchWebsite(AIRSTRIDE_URL);

      console.log(`  Factual confidence: ${result.confidence.factual}`);
      console.log(`  Inferred confidence: ${result.confidence.inferred}`);
      console.log(
        `  Confidence ratio (factual/inferred): ${(
          result.confidence.factual / result.confidence.inferred
        ).toFixed(2)}`
      );

      // Both should be present and valid
      expect(result.confidence.factual).toBeGreaterThan(0);
      expect(result.confidence.inferred).toBeGreaterThan(0);

      console.log("  ✓ Confidence scores properly calculated");
    },
    TEST_TIMEOUT
  );
});

