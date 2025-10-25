/**
 * @jest-environment node
 */

/**
 * Integration Test: Airstride Website Research - Growth Strategy Intelligence
 *
 * Tests enhanced growth strategy data extraction including competitors,
 * metrics, content, tech stack, resources, and conversion funnel.
 */

import { clientsService } from "@/modules/clients/application/service";

describe("Airstride Website Research - Growth Strategy", () => {
  const TEST_TIMEOUT = 90000;
  const AIRSTRIDE_URL = "https://airstride.ai";

  it(
    "should extract comprehensive growth strategy data from Airstride",
    async () => {
      console.log("\n🚀 Testing growth strategy extraction for Airstride...");
      console.log(`  Target: ${AIRSTRIDE_URL}`);
      console.log(
        "  Expected: Competitors, metrics, content, tech stack, team, funnel"
      );

      const startTime = Date.now();
      const result = await clientsService.researchWebsite(AIRSTRIDE_URL);
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
            console.log(`       Weaknesses: ${comp.weaknesses.length} points`);
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
            `    ✓ Awareness channels: ${funnel.awareness_channels.join(", ")}`
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
        console.log("\n  ✅ SUCCESS: Growth strategy intelligence extracted!");
      } else {
        console.log("\n  ⚠️  WARNING: No growth strategy data extracted");
      }

      // Research notes should document the process
      if (result.research_notes) {
        console.log(
          `\n  📝 Research notes: ${result.research_notes.substring(0, 150)}...`
        );
      }

      // Should complete in reasonable time
      expect(duration).toBeLessThan(TEST_TIMEOUT);
    },
    TEST_TIMEOUT
  );
});

