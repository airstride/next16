/**
 * @jest-environment node
 */

/**
 * Integration Test: Client Website Research - Airstride Streaming
 *
 * Tests the streaming AI-powered website research functionality specifically for Airstride.
 * Uses real AI providers to verify the streaming research workflow with progress updates.
 */

import { clientsService } from "@/modules/clients/application/service";
import { StreamEventType } from "@/shared/ai-sdk";

describe("Client Website Research - Airstride Streaming", () => {
  // 120-second timeout for AI streaming operations
  const TEST_TIMEOUT = 120000;

  it(
    "should stream research for airstride.ai with real-time progress updates",
    async () => {
      const websiteUrl = "https://airstride.ai";

      console.log(
        "🔍 Starting streaming website research test for Airstride..."
      );
      console.log(`  Website: ${websiteUrl}`);

      const startTime = Date.now();

      // Call the streaming service method
      const streamResult = await clientsService.streamResearchWebsite(
        websiteUrl
      );

      // Track received events
      const receivedEvents: string[] = [];
      let lastProgress = 0;
      let hasStartEvent = false;
      let hasSearchEvent = false;
      let hasProgressEvent = false;
      let hasPartialEvent = false;
      let hasCompleteEvent = false;
      let partialDataCount = 0;
      let finalData: any = null;

      console.log("📡 Consuming event stream...");

      // Consume the event stream
      if (streamResult.eventStream) {
        const eventReader = streamResult.eventStream.getReader();
        let streamClosed = false;

        try {
          while (true) {
            const { done, value: event } = await eventReader.read();

            if (done) {
              console.log("  ✅ Event stream completed");
              streamClosed = true;
              break;
            }

            receivedEvents.push(event.type);

            // Log event details
            console.log(`  [${event.type}] ${event.message || "No message"}`);
            if (event.progress !== undefined) {
              console.log(`    Progress: ${event.progress}%`);
              lastProgress = event.progress;
            }
            if (event.metadata) {
              console.log(`    Metadata:`, event.metadata);
            }

            // Track event types
            switch (event.type) {
              case StreamEventType.START:
                hasStartEvent = true;
                expect(event.progress).toBe(0);
                expect(event.message).toBeDefined();
                break;

              case StreamEventType.SEARCH:
                hasSearchEvent = true;
                expect(event.step).toBe("search");
                expect(event.message).toBeDefined();
                break;

              case StreamEventType.PROGRESS:
                hasProgressEvent = true;
                expect(event.progress).toBeGreaterThan(0);
                expect(event.message).toBeDefined();
                // Should have metadata about sources found
                if (event.metadata?.sourcesFound !== undefined) {
                  console.log(
                    `    ✓ Found ${event.metadata.sourcesFound} sources`
                  );
                  expect(event.metadata.sourcesFound).toBeGreaterThanOrEqual(0);
                }
                break;

              case StreamEventType.PARTIAL:
                hasPartialEvent = true;
                partialDataCount++;
                expect(event.data).toBeDefined();
                console.log(`    ✓ Partial data update #${partialDataCount}`);
                // Log partial data in detail
                if (event.data) {
                  const fields = Object.keys(event.data);
                  console.log(`      Fields: ${fields.join(", ")}`);

                  // Log actual values for key fields
                  if (event.data.company) {
                    console.log(`      📊 Company Data:`);
                    if (event.data.company.name)
                      console.log(
                        `         Name: "${event.data.company.name}"`
                      );
                    if (event.data.company.industry)
                      console.log(
                        `         Industry: "${event.data.company.industry}"`
                      );
                    if (event.data.company.stage)
                      console.log(
                        `         Stage: "${event.data.company.stage}"`
                      );
                    if (event.data.company.description) {
                      const desc = event.data.company.description.substring(
                        0,
                        100
                      );
                      console.log(
                        `         Description: "${desc}${
                          event.data.company.description.length > 100
                            ? "..."
                            : ""
                        }"`
                      );
                    }
                  }

                  // Show full partial JSON for deep inspection
                  console.log(`      📄 Partial JSON:`);
                  console.log(
                    JSON.stringify(event.data, null, 2)
                      .split("\n")
                      .map((line) => `         ${line}`)
                      .join("\n")
                  );
                }
                break;

              case StreamEventType.COMPLETE:
                hasCompleteEvent = true;
                expect(event.progress).toBe(100);
                expect(event.data).toBeDefined();
                finalData = event.data;
                console.log("    ✓ Research completed successfully!");
                streamClosed = true;
                break;

              case StreamEventType.ERROR:
                console.error("    ✗ Error event received:", event.error);
                streamClosed = true;
                throw new Error(`Stream error: ${event.error?.message}`);
            }
          }
        } finally {
          // Always release the lock
          if (!streamClosed) {
            try {
              eventReader.cancel();
            } catch (e) {
              // Ignore cancellation errors
            }
          }
          eventReader.releaseLock();
        }
      } else {
        throw new Error("Event stream not available");
      }

      const duration = Date.now() - startTime;
      console.log(`\n⏱️  Total duration: ${(duration / 1000).toFixed(2)}s`);

      // Validate event flow
      console.log("\n📊 Event Flow Validation:");
      console.log(`  Events received: ${receivedEvents.join(" → ")}`);
      console.log(`  Total events: ${receivedEvents.length}`);
      console.log(`  Partial updates: ${partialDataCount}`);
      console.log(`  Final progress: ${lastProgress}%`);

      // Assert event types received
      expect(hasStartEvent).toBe(true);
      console.log("  ✓ START event received");

      expect(hasSearchEvent).toBe(true);
      console.log("  ✓ SEARCH event received");

      expect(hasProgressEvent).toBe(true);
      console.log("  ✓ PROGRESS event received");

      expect(hasPartialEvent).toBe(true);
      console.log("  ✓ PARTIAL event received");

      expect(hasCompleteEvent).toBe(true);
      console.log("  ✓ COMPLETE event received");

      // Validate partial updates
      expect(partialDataCount).toBeGreaterThan(0);
      console.log(`  ✓ Received ${partialDataCount} partial data updates`);

      // Validate final data
      expect(finalData).toBeDefined();
      expect(finalData.company).toBeDefined();
      expect(finalData.company.name).toBeDefined();
      expect(finalData.company.name.length).toBeGreaterThan(0);

      console.log("\n" + "=".repeat(80));
      console.log("📋 FINAL EXTRACTED DATA - DETAILED VIEW");
      console.log("=".repeat(80));

      // Company Details
      console.log("\n🏢 COMPANY INFORMATION:");
      console.log(`  Name: ${finalData.company.name}`);
      console.log(`  Industry: ${finalData.company.industry || "N/A"}`);
      console.log(`  Stage: ${finalData.company.stage || "N/A"}`);
      console.log(`  Website: ${finalData.company.website || "N/A"}`);
      if (finalData.company.description) {
        console.log(`  Description: ${finalData.company.description}`);
      }
      if (finalData.company.tagline) {
        console.log(`  Tagline: "${finalData.company.tagline}"`);
      }
      if (finalData.company.founded_year) {
        console.log(`  Founded: ${finalData.company.founded_year}`);
      }
      if (finalData.company.size) {
        console.log(`  Size: ${finalData.company.size}`);
      }

      // Product Details
      if (finalData.product) {
        console.log("\n🎯 PRODUCT INFORMATION:");
        if (finalData.product.description) {
          console.log(`  Description: ${finalData.product.description}`);
        }
        if (
          finalData.product.features &&
          finalData.product.features.length > 0
        ) {
          console.log(`  Features (${finalData.product.features.length}):`);
          finalData.product.features.forEach((f: string, i: number) => {
            console.log(`    ${i + 1}. ${f}`);
          });
        }
        if (finalData.product.pricing_model) {
          console.log(`  Pricing Model: ${finalData.product.pricing_model}`);
        }
      }

      // ICP
      if (finalData.icp) {
        console.log("\n👥 IDEAL CUSTOMER PROFILE:");
        if (finalData.icp.description) {
          console.log(`  Description: ${finalData.icp.description}`);
        }
        if (
          finalData.icp.target_industries &&
          finalData.icp.target_industries.length > 0
        ) {
          console.log(
            `  Target Industries (${
              finalData.icp.target_industries.length
            }): ${finalData.icp.target_industries.join(", ")}`
          );
        }
        if (finalData.icp.target_company_size) {
          console.log(
            `  Target Company Size: ${finalData.icp.target_company_size}`
          );
        }
        if (finalData.icp.pain_points && finalData.icp.pain_points.length > 0) {
          console.log(`  Pain Points (${finalData.icp.pain_points.length}):`);
          finalData.icp.pain_points.forEach((p: string, i: number) => {
            console.log(`    ${i + 1}. ${p}`);
          });
        }
      }

      // Competitors
      if (finalData.competitors && finalData.competitors.length > 0) {
        console.log(`\n🔍 COMPETITORS (${finalData.competitors.length}):`);
        finalData.competitors.forEach((comp: any, i: number) => {
          console.log(`  ${i + 1}. ${comp.name}`);
          if (comp.website) console.log(`     Website: ${comp.website}`);
          if (comp.positioning)
            console.log(`     Positioning: ${comp.positioning}`);
          if (comp.strengths && comp.strengths.length > 0) {
            console.log(`     Strengths: ${comp.strengths.join(", ")}`);
          }
          if (comp.weaknesses && comp.weaknesses.length > 0) {
            console.log(`     Weaknesses: ${comp.weaknesses.join(", ")}`);
          }
          if (comp.estimated_monthly_traffic) {
            console.log(
              `     Est. Monthly Traffic: ${comp.estimated_monthly_traffic.toLocaleString()}`
            );
          }
        });
      }

      // Current Metrics
      if (finalData.current_metrics) {
        console.log("\n📈 CURRENT PERFORMANCE METRICS:");
        const m = finalData.current_metrics;
        if (m.monthly_traffic)
          console.log(
            `  Monthly Traffic: ${m.monthly_traffic.toLocaleString()}`
          );
        if (m.monthly_leads)
          console.log(`  Monthly Leads: ${m.monthly_leads.toLocaleString()}`);
        if (m.conversion_rate)
          console.log(
            `  Conversion Rate: ${(m.conversion_rate * 100).toFixed(2)}%`
          );
        if (m.cac) console.log(`  CAC: $${m.cac}`);
        if (m.ltv) console.log(`  LTV: $${m.ltv}`);
        if (m.traffic_sources && m.traffic_sources.length > 0) {
          console.log(`  Traffic Sources (${m.traffic_sources.length}):`);
          m.traffic_sources.forEach((s: any) => {
            console.log(`    - ${s.source}: ${s.percentage || "N/A"}%`);
          });
        }
        if (m.top_keywords && m.top_keywords.length > 0) {
          console.log(
            `  Top Keywords: ${m.top_keywords.slice(0, 5).join(", ")}`
          );
        }
      }

      // Content Inventory
      if (finalData.content_inventory) {
        console.log("\n📝 CONTENT INVENTORY:");
        const c = finalData.content_inventory;
        if (c.total_blog_posts)
          console.log(`  Blog Posts: ${c.total_blog_posts}`);
        if (c.total_case_studies)
          console.log(`  Case Studies: ${c.total_case_studies}`);
        if (c.total_videos) console.log(`  Videos: ${c.total_videos}`);
        if (c.total_whitepapers)
          console.log(`  Whitepapers: ${c.total_whitepapers}`);
        if (c.publishing_frequency)
          console.log(`  Publishing Frequency: ${c.publishing_frequency}`);
        if (c.content_themes && c.content_themes.length > 0) {
          console.log(`  Content Themes: ${c.content_themes.join(", ")}`);
        }
      }

      // Tech Stack
      if (finalData.tech_stack) {
        console.log("\n🛠️  TECH STACK:");
        const t = finalData.tech_stack;
        if (t.cms) console.log(`  CMS: ${t.cms}`);
        if (t.analytics && t.analytics.length > 0)
          console.log(`  Analytics: ${t.analytics.join(", ")}`);
        if (t.email_platform) console.log(`  Email: ${t.email_platform}`);
        if (t.crm) console.log(`  CRM: ${t.crm}`);
        if (t.marketing_automation)
          console.log(`  Marketing Automation: ${t.marketing_automation}`);
        if (t.seo_tools && t.seo_tools.length > 0)
          console.log(`  SEO Tools: ${t.seo_tools.join(", ")}`);
      }

      // Resources
      if (finalData.resources) {
        console.log("\n👥 TEAM & RESOURCES:");
        const r = finalData.resources;
        if (r.total_team_size)
          console.log(`  Total Team Size: ${r.total_team_size}`);
        if (r.marketing_team_size)
          console.log(`  Marketing Team: ${r.marketing_team_size}`);
        if (r.content_writers)
          console.log(`  Content Writers: ${r.content_writers}`);
        if (r.has_in_house_design !== undefined)
          console.log(
            `  In-house Design: ${r.has_in_house_design ? "Yes" : "No"}`
          );
        if (r.has_in_house_dev !== undefined)
          console.log(`  In-house Dev: ${r.has_in_house_dev ? "Yes" : "No"}`);
        if (r.monthly_marketing_budget)
          console.log(
            `  Marketing Budget: $${r.monthly_marketing_budget.toLocaleString()}/mo`
          );
      }

      // Conversion Funnel
      if (finalData.conversion_funnel) {
        console.log("\n🎯 CONVERSION FUNNEL:");
        const f = finalData.conversion_funnel;
        if (f.awareness_channels && f.awareness_channels.length > 0) {
          console.log(
            `  Awareness Channels: ${f.awareness_channels.join(", ")}`
          );
        }
        if (f.consideration_assets && f.consideration_assets.length > 0) {
          console.log(
            `  Consideration Assets: ${f.consideration_assets.join(", ")}`
          );
        }
        if (f.decision_triggers && f.decision_triggers.length > 0) {
          console.log(`  Decision Triggers: ${f.decision_triggers.join(", ")}`);
        }
        if (f.primary_cta) console.log(`  Primary CTA: "${f.primary_cta}"`);
        if (f.conversion_bottleneck)
          console.log(`  Bottleneck: ${f.conversion_bottleneck}`);
        if (f.avg_sales_cycle_days)
          console.log(`  Avg Sales Cycle: ${f.avg_sales_cycle_days} days`);
      }

      // Brand Voice
      if (finalData.brand_voice) {
        console.log("\n🎨 BRAND VOICE:");
        console.log(JSON.stringify(finalData.brand_voice, null, 2));
      }

      // Business Goals
      if (finalData.business_goals) {
        console.log("\n🎯 BUSINESS GOALS:");
        console.log(JSON.stringify(finalData.business_goals, null, 2));
      }

      // Marketing Assets
      if (finalData.marketing_assets) {
        console.log("\n📱 MARKETING ASSETS:");
        console.log(JSON.stringify(finalData.marketing_assets, null, 2));
      }

      // Confidence & Research Notes
      console.log("\n📊 CONFIDENCE SCORES:");
      console.log(JSON.stringify(finalData.confidence, null, 2));

      if (finalData.research_notes) {
        console.log("\n📝 RESEARCH NOTES:");
        console.log(`  ${finalData.research_notes}`);
      }

      // Show full JSON for debugging (if any fields are missing)
      console.log("\n🔍 DEBUG - FULL EXTRACTED DATA (JSON):");
      console.log(JSON.stringify(finalData, null, 2));

      console.log("\n" + "=".repeat(80));

      // Validate confidence scores
      expect(finalData.confidence).toBeDefined();
      expect(finalData.confidence.overall).toBeGreaterThanOrEqual(0);
      expect(finalData.confidence.overall).toBeLessThanOrEqual(1);
      expect(finalData.confidence.factual).toBeGreaterThanOrEqual(0);
      expect(finalData.confidence.factual).toBeLessThanOrEqual(1);
      expect(finalData.confidence.inferred).toBeGreaterThanOrEqual(0);
      expect(finalData.confidence.inferred).toBeLessThanOrEqual(1);

      // Verify the response completed within acceptable time
      expect(duration).toBeLessThan(TEST_TIMEOUT);

      // Verify progress increased over time
      expect(lastProgress).toBe(100);

      // Verify sources are available
      if (streamResult.sources) {
        console.log(
          `  ✓ Sources available: ${streamResult.sources.length || 0}`
        );
      }

      // Verify search text is available
      const searchText = await streamResult.searchTextPromise;
      expect(searchText).toBeDefined();
      expect(searchText.length).toBeGreaterThan(0);
      console.log(`  ✓ Search text length: ${searchText.length} characters`);

      console.log("\n✅ All streaming validations passed!");
    },
    TEST_TIMEOUT
  );
});
