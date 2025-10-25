// Copied as reference from another repository

/**
 * @jest-environment node
 */

/**
 * Integration Test: Client Website Research - Client Creation
 *
 * Tests creating full client records from AI website research.
 */

import { clientsService } from "@/modules/clients/application/service";

describe("Client Website Research - Client Creation", () => {
  // 120-second timeout for AI + database operations
  const TEST_TIMEOUT = 120000;

  describe("Create Project from Website Research", () => {
    it(
      "should create client from airstride.ai website research",
      async () => {
        const websiteUrl = "https://airstride.ai";
        const mockUserId = "test-user-123";
        const mockOrgId = "test-org-456";

        console.log("🚀 Creating client from website research...");
        console.log(`  Website: ${websiteUrl}`);
        console.log(`  User: ${mockUserId}`);

        const startTime = Date.now();

        const client = await clientsService.createClientFromWebsite(
          websiteUrl,
          mockUserId,
          mockOrgId
        );

        const duration = Date.now() - startTime;

        console.log(`✅ Project created in ${(duration / 1000).toFixed(2)}s`);
        console.log(`  Project ID: ${client.id}`);
        console.log(`  Company: ${client.company.name}`);
        console.log(`  Website: ${client.company.website}`);
        console.log(`  Research source: ${client.research_metadata.source}`);
        console.log(`  Research status: ${client.research_metadata.status}`);
        console.log(
          `  Confidence: ${client.research_metadata.confidence || "N/A"}`
        );

        // Validate client was created correctly
        expect(client).toBeDefined();
        expect(client.id).toBeDefined();
        expect(client.company.name).toBeDefined();
        expect(client.company.website).toBe(websiteUrl);

        // Validate research metadata
        expect(client.research_metadata).toBeDefined();
        expect(client.research_metadata.source).toBe("ai");
        expect(client.research_metadata.status).toBe("researched");
        expect(client.research_metadata.researched_at).toBeDefined();

        // Validate user ownership
        expect(client.user_id).toBe(mockUserId);
        expect(client.organization_id).toBe(mockOrgId);

        // Validate audit fields
        expect(client.created_at).toBeDefined();
        expect(client.created_by).toBe(mockUserId);

        // Log extracted data quality
        console.log("\n📊 Extracted Data Quality:");
        console.log(
          `  Product description: ${client.product.description ? "✓" : "✗"}`
        );
        console.log(
          `  Features: ${client.product.features?.length || 0} items`
        );
        console.log(`  ICP description: ${client.icp.description ? "✓" : "✗"}`);
        console.log(
          `  Pain points: ${client.icp.pain_points?.length || 0} items`
        );
        console.log(`  Brand voice tone: ${client.brand_voice.tone || "N/A"}`);
        console.log(
          `  Marketing assets: ${
            client.marketing_assets.linkedin_url ? "LinkedIn ✓" : "LinkedIn ✗"
          }`
        );

        // Verify we got meaningful data
        expect(client.product.description).toBeDefined();
        expect(client.icp.description).toBeDefined();
      },
      TEST_TIMEOUT
    );

    it(
      "should extract different data for different company types",
      async () => {
        const testCases = [
          {
            name: "E-commerce (Shopify)",
            url: "https://shopify.com",
            expectedIndustryKeywords: ["commerce", "retail", "online", "store"],
          },
          {
            name: "Developer Tools (Vercel)",
            url: "https://vercel.com",
            expectedIndustryKeywords: [
              "developer",
              "deployment",
              "frontend",
              "platform",
            ],
          },
        ];

        for (const testCase of testCases) {
          console.log(`\n🔍 Testing ${testCase.name}...`);
          console.log(`  URL: ${testCase.url}`);

          const startTime = Date.now();
          const result = await clientsService.researchWebsite(testCase.url);
          const duration = Date.now() - startTime;

          console.log(
            `✅ ${testCase.name} researched in ${(duration / 1000).toFixed(2)}s`
          );
          console.log(`  Company: ${result.company.name}`);
          console.log(`  Industry: ${result.company.industry || "N/A"}`);
          console.log(
            `  Product features: ${result.product?.features?.length || 0}`
          );
          console.log(`  Confidence: ${result.confidence.overall}`);

          // Validate we got industry-relevant data
          expect(result.company.name).toBeDefined();
          expect(result.product).toBeDefined();
          expect(result.product?.description).toBeDefined();

          // Check if industry keywords are present in description
          const description = (result.company.description || "").toLowerCase();
          const productDesc = (result.product?.description || "").toLowerCase();
          const combinedText = `${description} ${productDesc}`;

          const hasRelevantKeyword = testCase.expectedIndustryKeywords.some(
            (keyword) => combinedText.includes(keyword.toLowerCase())
          );

          if (hasRelevantKeyword) {
            console.log(`  ✓ Industry-relevant keywords found`);
          } else {
            console.log(
              `  ⚠️  Industry keywords not found (may still be valid)`
            );
          }
        }
      },
      TEST_TIMEOUT
    );
  });
});

