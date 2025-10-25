// Copied as reference from another repository

/**
 * @jest-environment node
 */

/**
 * Integration Test: Partner Research
 *
 * Tests the AI-powered partner research functionality with web search.
 * Uses real AI providers to verify the complete research workflow.
 */

import {
  AIModel,
  AIProvider,
  generateStructuredOutputWithWebSearch,
} from "@/lib/ai-sdk";
import { generatePartnerResearchPrompt } from "@/lib/ai-sdk/prompts";
import { PartnerResearchResponseSchema } from "@/lib/ai-sdk/schemas/partner.schema";

describe("Partner Research Integration Test", () => {
  // 90-second timeout for AI operations
  const TEST_TIMEOUT = 90000;

  it(
    "should successfully research a real company with web search",
    async () => {
      // Test with a well-known company that should have good online presence
      const testInput = {
        partnerName: "Spotify",
        websiteUrl: "https://spotify.com",
        currentDescription: "Music streaming platform",
        industry: "Entertainment",
        location: "Stockholm, Sweden",
      };

      const prompt = generatePartnerResearchPrompt(testInput);

      console.log("🔍 Starting partner research test...");
      console.log(`  Company: ${testInput.partnerName}`);
      console.log(`  Website: ${testInput.websiteUrl}`);

      const startTime = Date.now();

      const result = await generateStructuredOutputWithWebSearch({
        prompt,
        schema: PartnerResearchResponseSchema,
        config: {
          provider: AIProvider.GOOGLE,
          model: AIModel.GEMINI_2_5_FLASH_LITE,
          temperature: 0.3,
          maxTokens: 8192,
        },
      });

      const duration = Date.now() - startTime;

      console.log(`✅ Research completed in ${(duration / 1000).toFixed(2)}s`);
      console.log(`  Sources found: ${result.sources?.length || 0}`);

      // Validate the response structure - Spotify should always return success
      expect(result.object).toBeDefined();
      expect(result.object).toHaveProperty("company_profile");
      expect(result.object).toHaveProperty("products");

      // @ts-expect-error - Type narrowing after toHaveProperty not recognized by TS
      console.log(
        `  Company name: ${result.object.company_profile.company_name}`
      );
      // @ts-expect-error - Type narrowing after toHaveProperty not recognized by TS
      console.log(`  Categories: ${result.object.categories?.length || 0}`);
      // @ts-expect-error - Type narrowing after toHaveProperty not recognized by TS
      console.log(`  Products: ${result.object.products.length}`);

      // @ts-expect-error - Type narrowing after toHaveProperty not recognized by TS
      expect(result.object.company_profile.company_name).toBeDefined();
      // @ts-expect-error - Type narrowing after toHaveProperty not recognized by TS
      expect(result.object.products).toBeInstanceOf(Array);
      // @ts-expect-error - Type narrowing after toHaveProperty not recognized by TS
      expect(result.object.products.length).toBeGreaterThan(0);

      // Verify the response completed within acceptable time
      expect(duration).toBeLessThan(TEST_TIMEOUT);

      // Log performance warning if it takes longer than expected
      if (duration > 60000) {
        console.warn(
          `⚠️  Warning: Request took ${(duration / 1000).toFixed(
            2
          )}s (expected <60s)`
        );
      }
    },
    TEST_TIMEOUT
  );

  it(
    "should handle defunct/non-existent company gracefully",
    async () => {
      const testInput = {
        partnerName: "NonExistentCompany12345XYZ",
        websiteUrl: "https://thiscompanydoesnotexist12345.com",
        currentDescription: "Fake company for testing",
        industry: "Software",
        location: "Unknown",
      };

      const prompt = generatePartnerResearchPrompt(testInput);

      console.log("🔍 Testing defunct company handling...");

      const result = await generateStructuredOutputWithWebSearch({
        prompt,
        schema: PartnerResearchResponseSchema,
        config: {
          provider: AIProvider.GOOGLE,
          model: AIModel.GEMINI_2_5_FLASH_LITE,
          temperature: 0.3,
          maxTokens: 4096,
        },
      });

      // Should return error response for non-existent company
      expect(result.object).toBeDefined();
      expect(result.object).toHaveProperty("status");

      // @ts-expect-error - Type narrowing after toHaveProperty not recognized by TS
      console.log(`  Error status: ${result.object.status}`);

      // @ts-expect-error - Type narrowing after toHaveProperty not recognized by TS
      expect(["UNVERIFIED", "POSSIBLY_DEFUNCT", "NOT_FOUND"]).toContain(
        result.object.status
      );
      // @ts-expect-error - Type narrowing after toHaveProperty not recognized by TS
      expect(result.object.findings).toBeInstanceOf(Array);
    },
    TEST_TIMEOUT
  );
});
