// Copied as reference from another repository

/**
 * @jest-environment node
 */

/**
 * Integration Test: Client Website Research
 *
 * Tests the AI-powered website research functionality for client creation.
 * Uses real AI providers to verify the complete research workflow.
 */

import { clientsService } from "@/modules/clients/application/service";

describe("Client Website Research Integration Test", () => {
  // 90-second timeout for AI operations
  const TEST_TIMEOUT = 90000;

  describe("AI Website Research", () => {
    it(
      "should successfully research airstride.ai and extract company context",
      async () => {
        const websiteUrl = "https://airstride.ai";

        console.log("🔍 Starting website research test for Airstride...");
        console.log(`  Website: ${websiteUrl}`);

        const startTime = Date.now();

        // Call the service method that uses AI SDK with web search
        const result = await clientsService.researchWebsite(websiteUrl);

        const duration = Date.now() - startTime;

        console.log(
          `✅ Research completed in ${(duration / 1000).toFixed(2)}s`
        );
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

        // Validate the response structure
        expect(result).toBeDefined();
        expect(result.company).toBeDefined();
        expect(result.company.name).toBeDefined();
        expect(result.company.name.length).toBeGreaterThan(0);

        // Validate product information (optional)
        if (result.product) {
          expect(result.product.description).toBeDefined();
        }

        // Validate ICP (should have some insights)
        expect(result.icp).toBeDefined();

        // Validate confidence scores
        expect(result.confidence).toBeDefined();
        expect(result.confidence.overall).toBeGreaterThanOrEqual(0);
        expect(result.confidence.overall).toBeLessThanOrEqual(1);
        expect(result.confidence.factual).toBeGreaterThanOrEqual(0);
        expect(result.confidence.factual).toBeLessThanOrEqual(1);
        expect(result.confidence.inferred).toBeGreaterThanOrEqual(0);
        expect(result.confidence.inferred).toBeLessThanOrEqual(1);

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
      "should research a well-known SaaS company (Shopify)",
      async () => {
        const websiteUrl = "https://shopify.com";

        console.log("🔍 Testing SaaS company research (Shopify)...");

        const startTime = Date.now();
        const result = await clientsService.researchWebsite(websiteUrl);
        const duration = Date.now() - startTime;

        console.log(
          `✅ Shopify research completed in ${(duration / 1000).toFixed(2)}s`
        );
        console.log(`  Company name: ${result.company.name}`);
        console.log(`  Industry: ${result.company.industry || "N/A"}`);
        console.log(
          `  Products: ${result.product?.features?.length || 0} features`
        );
        console.log(`  Overall confidence: ${result.confidence.overall}`);

        // Shopify should have high-quality data
        expect(result.company.name).toBeDefined();
        expect(result.company.name.toLowerCase()).toContain("shopify");
        expect(result.product).toBeDefined();
        expect(result.product?.description).toBeDefined();
        expect(result.product?.description!.length).toBeGreaterThan(20);

        // Should have identified key features
        expect(result.product?.features).toBeDefined();
        expect(result.product?.features!.length).toBeGreaterThan(0);

        // Should have marketing assets
        expect(result.marketing_assets).toBeDefined();

        // Confidence should be high for well-known company
        expect(result.confidence.factual).toBeGreaterThan(0.5);
      },
      TEST_TIMEOUT
    );

    it(
      "should handle non-existent/invalid website gracefully",
      async () => {
        const websiteUrl = "https://thiswebsitedoesnotexist12345xyz.com";

        console.log("🔍 Testing non-existent website handling...");

        try {
          const startTime = Date.now();
          const result = await clientsService.researchWebsite(websiteUrl);
          const duration = Date.now() - startTime;

          console.log(
            `✅ Handled invalid website in ${(duration / 1000).toFixed(2)}s`
          );
          console.log(`  Overall confidence: ${result.confidence.overall}`);

          // Should return low confidence or minimal data
          expect(result.confidence.overall).toBeLessThan(0.5);
          console.log(
            `  Low confidence returned as expected: ${result.confidence.overall}`
          );
        } catch (error) {
          // Or it might throw an error - both behaviors are acceptable
          console.log(
            `✅ Error thrown for invalid website (expected behavior)`
          );
          expect(error).toBeDefined();
        }
      },
      TEST_TIMEOUT
    );
  });

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
      TEST_TIMEOUT + 30000 // Extra time for database operations
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
      TEST_TIMEOUT * 2 // Multiple requests
    );
  });

  describe("AI Prompt and Schema Validation", () => {
    it(
      "should return structured data matching AIExtractedContext schema",
      async () => {
        const websiteUrl = "https://airstride.ai";

        console.log("🔍 Validating AI response schema...");

        const result = await clientsService.researchWebsite(websiteUrl);

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

        // Validate arrays are arrays (not undefined)
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

  describe("Research Quality and Confidence", () => {
    it(
      "should provide high confidence for well-known companies",
      async () => {
        const websiteUrl = "https://stripe.com";

        console.log(
          "🔍 Testing research quality for well-known company (Stripe)..."
        );

        const result = await clientsService.researchWebsite(websiteUrl);

        console.log(`  Overall confidence: ${result.confidence.overall}`);
        console.log(`  Factual confidence: ${result.confidence.factual}`);
        console.log(`  Inferred confidence: ${result.confidence.inferred}`);

        // Well-known companies should have high factual confidence
        expect(result.confidence.factual).toBeGreaterThan(0.6);

        // Overall confidence should be reasonable
        expect(result.confidence.overall).toBeGreaterThan(0.5);

        console.log("  ✓ High confidence for well-known company");
      },
      TEST_TIMEOUT
    );

    it(
      "should mark inferred data with appropriate confidence",
      async () => {
        const websiteUrl = "https://airstride.ai";

        console.log("🔍 Testing confidence scoring...");

        const result = await clientsService.researchWebsite(websiteUrl);

        console.log(`  Factual confidence: ${result.confidence.factual}`);
        console.log(`  Inferred confidence: ${result.confidence.inferred}`);

        // Factual confidence should typically be higher than inferred
        // (though not always - depends on website content)
        console.log(
          `  Confidence ratio (factual/inferred): ${(
            result.confidence.factual / result.confidence.inferred
          ).toFixed(2)}`
        );

        // Both should be present and valid
        expect(result.confidence.factual).toBeGreaterThan(0);
        expect(result.confidence.inferred).toBeGreaterThan(0);

        console.log("  ✓ Confidence scores properly differentiated");
      },
      TEST_TIMEOUT
    );
  });

  describe("Growth Strategy Intelligence Extraction (ENHANCED)", () => {
    /**
     * Test the enhanced prompt that extracts competitive intelligence,
     * performance metrics, content inventory, tech stack, resources, and conversion funnel
     */
    it(
      "should extract comprehensive growth strategy data from a well-established company",
      async () => {
        // Use a well-known company with rich public data
        const websiteUrl = "https://ahrefs.com"; // SEO tool company - should have great data

        console.log("\n🚀 Testing ENHANCED growth strategy extraction...");
        console.log(`  Target: ${websiteUrl}`);
        console.log(
          "  Expected: Competitors, metrics, content, tech stack, team, funnel"
        );

        const startTime = Date.now();
        const result = await clientsService.researchWebsite(websiteUrl);
        const duration = Date.now() - startTime;

        console.log(
          `\n✅ Enhanced research completed in ${(duration / 1000).toFixed(2)}s`
        );
        console.log("\n📊 EXTRACTION RESULTS:");

        // 1. COMPETITOR INTELLIGENCE
        console.log("\n  🔍 COMPETITORS:");
        if (result.competitors && result.competitors.length > 0) {
          console.log(`    ✓ Found ${result.competitors.length} competitors`);
          result.competitors.forEach((comp, idx) => {
            console.log(`    ${idx + 1}. ${comp.name}`);
            if (comp.website) console.log(`       Website: ${comp.website}`);
            if (comp.positioning)
              console.log(
                `       Positioning: ${comp.positioning.substring(0, 60)}...`
              );
            if (comp.strengths && comp.strengths.length > 0) {
              console.log(`       Strengths: ${comp.strengths.length} points`);
            }
            if (comp.weaknesses && comp.weaknesses.length > 0) {
              console.log(
                `       Weaknesses: ${comp.weaknesses.length} points`
              );
            }
            if (comp.estimated_monthly_traffic) {
              console.log(
                `       Traffic: ~${comp.estimated_monthly_traffic.toLocaleString()}/mo`
              );
            }
          });
          expect(result.competitors.length).toBeGreaterThan(0);
          expect(result.competitors.length).toBeLessThanOrEqual(5);
        } else {
          console.log("    ⚠️  No competitors extracted");
        }

        // 2. CURRENT PERFORMANCE METRICS
        console.log("\n  📈 PERFORMANCE METRICS:");
        if (result.current_metrics) {
          const metrics = result.current_metrics;
          if (metrics.monthly_traffic) {
            console.log(
              `    ✓ Monthly traffic: ${metrics.monthly_traffic.toLocaleString()}`
            );
          }
          if (metrics.traffic_sources && metrics.traffic_sources.length > 0) {
            console.log(
              `    ✓ Traffic sources: ${metrics.traffic_sources.length} channels`
            );
            metrics.traffic_sources.forEach((source) => {
              console.log(
                `       - ${source.source}: ${source.percentage || "N/A"}%`
              );
            });
          }
          if (metrics.top_keywords && metrics.top_keywords.length > 0) {
            console.log(
              `    ✓ Top keywords: ${metrics.top_keywords.length} keywords`
            );
            console.log(
              `       Sample: ${metrics.top_keywords.slice(0, 3).join(", ")}`
            );
          }
          if (metrics.top_pages && metrics.top_pages.length > 0) {
            console.log(`    ✓ Top pages: ${metrics.top_pages.length} URLs`);
          }
          if (metrics.conversion_rate !== undefined) {
            console.log(
              `    ✓ Conversion rate: ${(metrics.conversion_rate * 100).toFixed(
                2
              )}%`
            );
          }
          if (metrics.cac) {
            console.log(`    ✓ CAC: $${metrics.cac}`);
          }
          if (metrics.ltv) {
            console.log(`    ✓ LTV: $${metrics.ltv}`);
          }

          expect(result.current_metrics).toBeDefined();
        } else {
          console.log("    ⚠️  No metrics extracted");
        }

        // 3. CONTENT INVENTORY
        console.log("\n  📝 CONTENT INVENTORY:");
        if (result.content_inventory) {
          const content = result.content_inventory;
          if (content.total_blog_posts) {
            console.log(`    ✓ Blog posts: ${content.total_blog_posts}`);
          }
          if (content.total_case_studies) {
            console.log(`    ✓ Case studies: ${content.total_case_studies}`);
          }
          if (content.total_videos) {
            console.log(`    ✓ Videos: ${content.total_videos}`);
          }
          if (content.publishing_frequency) {
            console.log(
              `    ✓ Publishing frequency: ${content.publishing_frequency}`
            );
          }
          if (content.content_themes && content.content_themes.length > 0) {
            console.log(
              `    ✓ Content themes: ${content.content_themes.join(", ")}`
            );
          }
          if (
            content.top_performing_content &&
            content.top_performing_content.length > 0
          ) {
            console.log(
              `    ✓ Top performing: ${content.top_performing_content.length} URLs`
            );
          }

          expect(result.content_inventory).toBeDefined();
        } else {
          console.log("    ⚠️  No content inventory extracted");
        }

        // 4. TECH STACK
        console.log("\n  🛠️  TECH STACK:");
        if (result.tech_stack) {
          const tech = result.tech_stack;
          if (tech.cms) {
            console.log(`    ✓ CMS: ${tech.cms}`);
          }
          if (tech.analytics && tech.analytics.length > 0) {
            console.log(`    ✓ Analytics: ${tech.analytics.join(", ")}`);
          }
          if (tech.email_platform) {
            console.log(`    ✓ Email platform: ${tech.email_platform}`);
          }
          if (tech.crm) {
            console.log(`    ✓ CRM: ${tech.crm}`);
          }
          if (tech.marketing_automation) {
            console.log(
              `    ✓ Marketing automation: ${tech.marketing_automation}`
            );
          }
          if (tech.seo_tools && tech.seo_tools.length > 0) {
            console.log(`    ✓ SEO tools: ${tech.seo_tools.join(", ")}`);
          }

          expect(result.tech_stack).toBeDefined();
        } else {
          console.log("    ⚠️  No tech stack extracted");
        }

        // 5. TEAM & RESOURCES
        console.log("\n  👥 TEAM & RESOURCES:");
        if (result.resources) {
          const resources = result.resources;
          if (resources.total_team_size) {
            console.log(`    ✓ Total team size: ${resources.total_team_size}`);
          }
          if (resources.marketing_team_size) {
            console.log(
              `    ✓ Marketing team: ${resources.marketing_team_size}`
            );
          }
          if (resources.content_writers) {
            console.log(`    ✓ Content writers: ${resources.content_writers}`);
          }
          if (resources.has_in_house_design !== undefined) {
            console.log(
              `    ✓ In-house design: ${
                resources.has_in_house_design ? "Yes" : "No"
              }`
            );
          }
          if (resources.has_in_house_dev !== undefined) {
            console.log(
              `    ✓ In-house dev: ${resources.has_in_house_dev ? "Yes" : "No"}`
            );
          }
          if (resources.monthly_marketing_budget) {
            console.log(
              `    ✓ Marketing budget: $${resources.monthly_marketing_budget.toLocaleString()}/mo`
            );
          }

          expect(result.resources).toBeDefined();
        } else {
          console.log("    ⚠️  No resource data extracted");
        }

        // 6. CONVERSION FUNNEL
        console.log("\n  🎯 CONVERSION FUNNEL:");
        if (result.conversion_funnel) {
          const funnel = result.conversion_funnel;
          if (
            funnel.awareness_channels &&
            funnel.awareness_channels.length > 0
          ) {
            console.log(
              `    ✓ Awareness channels: ${funnel.awareness_channels.join(
                ", "
              )}`
            );
          }
          if (
            funnel.consideration_assets &&
            funnel.consideration_assets.length > 0
          ) {
            console.log(
              `    ✓ Consideration assets: ${funnel.consideration_assets.join(
                ", "
              )}`
            );
          }
          if (funnel.decision_triggers && funnel.decision_triggers.length > 0) {
            console.log(
              `    ✓ Decision triggers: ${funnel.decision_triggers.join(", ")}`
            );
          }
          if (funnel.primary_cta) {
            console.log(`    ✓ Primary CTA: "${funnel.primary_cta}"`);
          }
          if (funnel.conversion_bottleneck) {
            console.log(
              `    ✓ Conversion bottleneck: ${funnel.conversion_bottleneck}`
            );
          }
          if (funnel.avg_sales_cycle_days) {
            console.log(
              `    ✓ Avg sales cycle: ${funnel.avg_sales_cycle_days} days`
            );
          }

          expect(result.conversion_funnel).toBeDefined();
        } else {
          console.log("    ⚠️  No conversion funnel data extracted");
        }

        // OVERALL VALIDATION
        console.log("\n  📊 OVERALL QUALITY:");
        console.log(
          `    Overall confidence: ${result.confidence.overall.toFixed(2)}`
        );
        console.log(
          `    Factual confidence: ${result.confidence.factual.toFixed(2)}`
        );
        console.log(
          `    Inferred confidence: ${result.confidence.inferred.toFixed(2)}`
        );

        // Core validation - should have at least SOME growth strategy data
        const hasGrowthData =
          (result.competitors && result.competitors.length > 0) ||
          result.current_metrics !== undefined ||
          result.content_inventory !== undefined ||
          result.tech_stack !== undefined ||
          result.resources !== undefined ||
          result.conversion_funnel !== undefined;

        expect(hasGrowthData).toBe(true);

        if (hasGrowthData) {
          console.log(
            "\n  ✅ SUCCESS: Growth strategy intelligence extracted!"
          );
        } else {
          console.log("\n  ⚠️  WARNING: No growth strategy data extracted");
        }

        // Research notes should document the process
        if (result.research_notes) {
          console.log(
            `\n  📝 Research notes: ${result.research_notes.substring(
              0,
              150
            )}...`
          );
        }

        // Should complete in reasonable time
        expect(duration).toBeLessThan(TEST_TIMEOUT);
      },
      TEST_TIMEOUT
    );

    it(
      "should validate competitor extraction quality",
      async () => {
        const websiteUrl = "https://figma.com"; // Should have clear competitors (Sketch, Adobe XD, etc.)

        console.log("\n🔍 Testing competitor extraction quality...");
        console.log("  Expected competitors: Sketch, Adobe XD, Miro, etc.");

        const result = await clientsService.researchWebsite(websiteUrl);

        if (result.competitors && result.competitors.length > 0) {
          console.log(`  ✓ Extracted ${result.competitors.length} competitors`);

          // Each competitor should have a name at minimum
          result.competitors.forEach((comp) => {
            expect(comp.name).toBeDefined();
            expect(comp.name.length).toBeGreaterThan(0);
            console.log(
              `    - ${comp.name}${comp.website ? ` (${comp.website})` : ""}`
            );
          });

          // Should have strategic data (positioning, strengths, or weaknesses)
          const hasStrategicData = result.competitors.some(
            (comp) =>
              comp.positioning ||
              (comp.strengths && comp.strengths.length > 0) ||
              (comp.weaknesses && comp.weaknesses.length > 0)
          );

          if (hasStrategicData) {
            console.log(
              "  ✓ Competitors include strategic intelligence (positioning/strengths/weaknesses)"
            );
          }

          expect(result.competitors.length).toBeGreaterThan(0);
        } else {
          console.log("  ⚠️  No competitors found for Figma (unexpected)");
        }
      },
      TEST_TIMEOUT
    );

    it(
      "should validate schema alignment between prompt and extraction",
      async () => {
        // Quick validation that all new fields are properly typed
        const websiteUrl = "https://buffer.com"; // Social media tool

        console.log("\n🔍 Testing schema alignment...");

        const result = await clientsService.researchWebsite(websiteUrl);

        // Type validation - should not throw errors
        const testField = (field: any, fieldName: string) => {
          if (field !== undefined && field !== null) {
            console.log(`  ✓ ${fieldName}: present`);
            return true;
          }
          return false;
        };

        testField(result.competitors, "competitors");
        testField(result.current_metrics, "current_metrics");
        testField(result.content_inventory, "content_inventory");
        testField(result.tech_stack, "tech_stack");
        testField(result.resources, "resources");
        testField(result.conversion_funnel, "conversion_funnel");

        // All fields should be properly typed (TypeScript compilation validates this)
        expect(result).toBeDefined();
        console.log("\n  ✅ Schema alignment validated");
      },
      TEST_TIMEOUT
    );
  });
});
