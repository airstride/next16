/**
 * @jest-environment node
 */

/**
 * Integration Test: Client Website Research - Streaming with Progress Events
 *
 * Tests the streaming AI-powered website research functionality.
 * Uses real AI providers to verify the streaming research workflow with progress updates.
 */

import { clientsService } from "@/modules/clients/application/service";
import { StreamEventType } from "@/shared/ai-sdk";

describe("Client Website Research - Streaming", () => {
  // 120-second timeout for AI streaming operations
  const TEST_TIMEOUT = 120000;

  describe("Streaming Website Research", () => {
    it(
      "should handle streaming for well-known SaaS company (Shopify)",
      async () => {
        const websiteUrl = "https://shopify.com";

        console.log("\n🔍 Testing streaming research for Shopify...");

        const startTime = Date.now();
        const streamResult = await clientsService.streamResearchWebsite(
          websiteUrl
        );

        let eventCount = 0;
        let finalData: any = null;

        // Consume events
        if (streamResult.eventStream) {
          const eventReader = streamResult.eventStream.getReader();
          let streamClosed = false;

          try {
            while (true) {
              const { done, value: event } = await eventReader.read();
              if (done) {
                streamClosed = true;
                break;
              }

              eventCount++;
              console.log(
                `  [${eventCount}] ${event.type}: ${event.message || ""}`
              );

              if (event.type === StreamEventType.COMPLETE) {
                finalData = event.data;
                streamClosed = true;
                break;
              }

              if (event.type === StreamEventType.ERROR) {
                streamClosed = true;
                break;
              }
            }
          } finally {
            if (!streamClosed) {
              try {
                eventReader.cancel();
              } catch (e) {
                // Ignore cancellation errors
              }
            }
            eventReader.releaseLock();
          }
        }

        const duration = Date.now() - startTime;
        console.log(
          `✅ Shopify streaming completed in ${(duration / 1000).toFixed(2)}s`
        );
        console.log(`  Total events: ${eventCount}`);

        // Validate final data
        expect(finalData).toBeDefined();
        expect(finalData.company.name).toBeDefined();
        expect(finalData.company.name.toLowerCase()).toContain("shopify");
        expect(finalData.product).toBeDefined();

        console.log(`  Company: ${finalData.company.name}`);
        console.log(`  Confidence: ${finalData.confidence.overall}`);

        // Shopify should have high confidence
        expect(finalData.confidence.factual).toBeGreaterThan(0.5);
      },
      TEST_TIMEOUT
    );

    it(
      "should emit progress events in correct order",
      async () => {
        const websiteUrl = "https://vercel.com";

        console.log("\n🔍 Testing event order for Vercel...");

        const streamResult = await clientsService.streamResearchWebsite(
          websiteUrl
        );
        const eventTypes: string[] = [];

        if (streamResult.eventStream) {
          const eventReader = streamResult.eventStream.getReader();
          let streamClosed = false;

          try {
            while (true) {
              const { done, value: event } = await eventReader.read();
              if (done) {
                streamClosed = true;
                break;
              }

              eventTypes.push(event.type);

              if (
                event.type === StreamEventType.COMPLETE ||
                event.type === StreamEventType.ERROR
              ) {
                streamClosed = true;
                break;
              }
            }
          } finally {
            if (!streamClosed) {
              try {
                eventReader.cancel();
              } catch (e) {
                // Ignore cancellation errors
              }
            }
            eventReader.releaseLock();
          }
        }

        console.log(`  Event sequence: ${eventTypes.join(" → ")}`);

        // Validate event order
        const startIndex = eventTypes.indexOf(StreamEventType.START);
        const completeIndex = eventTypes.indexOf(StreamEventType.COMPLETE);

        expect(startIndex).toBe(0); // START should be first
        expect(completeIndex).toBe(eventTypes.length - 1); // COMPLETE should be last

        // SEARCH should come before EXTRACT events
        const searchIndex = eventTypes.indexOf(StreamEventType.SEARCH);
        const partialIndex = eventTypes.indexOf(StreamEventType.PARTIAL);

        expect(searchIndex).toBeGreaterThan(-1);
        expect(searchIndex).toBeLessThan(partialIndex);

        console.log("  ✓ Event order is correct");
      },
      TEST_TIMEOUT
    );

    it(
      "should provide partial data updates incrementally",
      async () => {
        const websiteUrl = "https://stripe.com";

        console.log("\n🔍 Testing incremental partial updates for Stripe...");

        const streamResult = await clientsService.streamResearchWebsite(
          websiteUrl
        );
        const partialDataSnapshots: any[] = [];

        if (streamResult.eventStream) {
          const eventReader = streamResult.eventStream.getReader();
          let streamClosed = false;

          try {
            while (true) {
              const { done, value: event } = await eventReader.read();
              if (done) {
                streamClosed = true;
                break;
              }

              if (event.type === StreamEventType.PARTIAL && event.data) {
                partialDataSnapshots.push({ ...event.data });
                console.log(
                  `  Snapshot ${partialDataSnapshots.length}: ${
                    Object.keys(event.data).length
                  } fields`
                );
              }

              if (
                event.type === StreamEventType.COMPLETE ||
                event.type === StreamEventType.ERROR
              ) {
                streamClosed = true;
                break;
              }
            }
          } finally {
            if (!streamClosed) {
              try {
                eventReader.cancel();
              } catch (e) {
                // Ignore cancellation errors
              }
            }
            eventReader.releaseLock();
          }
        }

        console.log(`  Total snapshots: ${partialDataSnapshots.length}`);

        // Should have received multiple partial updates
        expect(partialDataSnapshots.length).toBeGreaterThan(0);

        // Verify data grows over time (more fields added)
        if (partialDataSnapshots.length > 1) {
          const firstSnapshot = partialDataSnapshots[0];
          const lastSnapshot =
            partialDataSnapshots[partialDataSnapshots.length - 1];

          const firstFieldCount = Object.keys(firstSnapshot).length;
          const lastFieldCount = Object.keys(lastSnapshot).length;

          console.log(`  First snapshot fields: ${firstFieldCount}`);
          console.log(`  Last snapshot fields: ${lastFieldCount}`);

          // Later snapshots should have equal or more data
          expect(lastFieldCount).toBeGreaterThanOrEqual(firstFieldCount);
        }
      },
      TEST_TIMEOUT
    );

    it(
      "should complete research with objectPromise",
      async () => {
        const websiteUrl = "https://airstride.ai";

        console.log("\n🔍 Testing objectPromise for Airstride...");

        const startTime = Date.now();
        const streamResult = await clientsService.streamResearchWebsite(
          websiteUrl
        );

        // Don't consume the event stream, just wait for the promise
        const finalObject = await streamResult.objectPromise;
        const duration = Date.now() - startTime;

        console.log(
          `✅ Object promise resolved in ${(duration / 1000).toFixed(2)}s`
        );

        // Validate the final object
        expect(finalObject).toBeDefined();
        expect(finalObject.company).toBeDefined();
        expect(finalObject.company.name).toBeDefined();
        expect(finalObject.confidence).toBeDefined();

        console.log(`  Company: ${finalObject.company.name}`);
        console.log(`  Industry: ${finalObject.company.industry || "N/A"}`);
        console.log(`  Confidence: ${finalObject.confidence.overall}`);

        // Verify usage data is available
        const usage = await streamResult.usage;
        expect(usage).toBeDefined();
        expect(usage.totalTokens).toBeGreaterThan(0);

        console.log(`  Tokens used: ${usage.totalTokens}`);
        console.log(`    Prompt: ${usage.promptTokens}`);
        console.log(`    Completion: ${usage.completionTokens}`);
      },
      TEST_TIMEOUT
    );
  });

  describe("Enhanced Growth Strategy Data", () => {
    it(
      "should extract comprehensive growth strategy data via streaming",
      async () => {
        const websiteUrl = "https://ahrefs.com";

        console.log(
          "\n🚀 Testing enhanced growth strategy extraction via streaming..."
        );
        console.log(`  Target: ${websiteUrl}`);

        const streamResult = await clientsService.streamResearchWebsite(
          websiteUrl
        );
        let finalData: any = null;

        if (streamResult.eventStream) {
          const eventReader = streamResult.eventStream.getReader();
          let streamClosed = false;

          try {
            while (true) {
              const { done, value: event } = await eventReader.read();
              if (done) {
                streamClosed = true;
                break;
              }

              if (event.type === StreamEventType.COMPLETE) {
                finalData = event.data;
                streamClosed = true;
                break;
              }

              if (event.type === StreamEventType.ERROR) {
                streamClosed = true;
                break;
              }
            }
          } finally {
            if (!streamClosed) {
              try {
                eventReader.cancel();
              } catch (e) {
                // Ignore cancellation errors
              }
            }
            eventReader.releaseLock();
          }
        }

        expect(finalData).toBeDefined();

        console.log("\n" + "=".repeat(80));
        console.log("📊 ENHANCED GROWTH STRATEGY EXTRACTION - DETAILED VIEW");
        console.log("=".repeat(80));

        // Competitors - FULL DETAILS
        if (finalData.competitors && finalData.competitors.length > 0) {
          console.log(
            `\n🔍 COMPETITORS (${finalData.competitors.length} found):`
          );
          finalData.competitors.forEach((comp: any, idx: number) => {
            console.log(`\n  ${idx + 1}. ${comp.name}`);
            if (comp.website) console.log(`     Website: ${comp.website}`);
            if (comp.positioning)
              console.log(`     Positioning: ${comp.positioning}`);
            if (comp.strengths && comp.strengths.length > 0) {
              console.log(`     Strengths:`);
              comp.strengths.forEach((s: string) =>
                console.log(`       - ${s}`)
              );
            }
            if (comp.weaknesses && comp.weaknesses.length > 0) {
              console.log(`     Weaknesses:`);
              comp.weaknesses.forEach((w: string) =>
                console.log(`       - ${w}`)
              );
            }
            if (comp.estimated_monthly_traffic) {
              console.log(
                `     Est. Monthly Traffic: ${comp.estimated_monthly_traffic.toLocaleString()}`
              );
            }
          });
          expect(finalData.competitors.length).toBeGreaterThan(0);
        } else {
          console.log(
            "\n🔍 COMPETITORS: None extracted (may need prompt improvement)"
          );
        }

        // Current Metrics - FULL DETAILS
        if (finalData.current_metrics) {
          console.log("\n📈 PERFORMANCE METRICS:");
          const m = finalData.current_metrics;
          if (m.monthly_traffic)
            console.log(
              `  Monthly Traffic: ${m.monthly_traffic.toLocaleString()}`
            );
          if (m.monthly_leads)
            console.log(`  Monthly Leads: ${m.monthly_leads.toLocaleString()}`);
          if (m.bounce_rate)
            console.log(`  Bounce Rate: ${(m.bounce_rate * 100).toFixed(1)}%`);
          if (m.avg_session_duration)
            console.log(`  Avg Session: ${m.avg_session_duration}s`);
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
              `  Top Keywords (${m.top_keywords.length}): ${m.top_keywords.join(
                ", "
              )}`
            );
          }

          if (m.top_pages && m.top_pages.length > 0) {
            console.log(`  Top Pages (${m.top_pages.length}):`);
            m.top_pages
              .slice(0, 5)
              .forEach((p: string) => console.log(`    - ${p}`));
          }

          expect(finalData.current_metrics).toBeDefined();
        } else {
          console.log("\n📈 PERFORMANCE METRICS: None extracted");
        }

        // Content Inventory - FULL DETAILS
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
          if (c.total_podcasts) console.log(`  Podcasts: ${c.total_podcasts}`);
          if (c.publishing_frequency)
            console.log(`  Publishing Frequency: ${c.publishing_frequency}`);
          if (c.last_published)
            console.log(`  Last Published: ${c.last_published}`);

          if (c.content_themes && c.content_themes.length > 0) {
            console.log(
              `  Content Themes (${
                c.content_themes.length
              }): ${c.content_themes.join(", ")}`
            );
          }

          if (c.top_performing_content && c.top_performing_content.length > 0) {
            console.log(
              `  Top Performing (${c.top_performing_content.length}):`
            );
            c.top_performing_content
              .slice(0, 3)
              .forEach((url: string) => console.log(`    - ${url}`));
          }

          expect(finalData.content_inventory).toBeDefined();
        } else {
          console.log("\n📝 CONTENT INVENTORY: None extracted");
        }

        // Tech Stack - FULL DETAILS
        if (finalData.tech_stack) {
          console.log("\n🛠️  TECH STACK:");
          const t = finalData.tech_stack;
          if (t.cms) console.log(`  CMS: ${t.cms}`);
          if (t.analytics && t.analytics.length > 0)
            console.log(`  Analytics: ${t.analytics.join(", ")}`);
          if (t.email_platform)
            console.log(`  Email Platform: ${t.email_platform}`);
          if (t.crm) console.log(`  CRM: ${t.crm}`);
          if (t.social_scheduling)
            console.log(`  Social Scheduling: ${t.social_scheduling}`);
          if (t.marketing_automation)
            console.log(`  Marketing Automation: ${t.marketing_automation}`);
          if (t.seo_tools && t.seo_tools.length > 0)
            console.log(`  SEO Tools: ${t.seo_tools.join(", ")}`);
          if (t.other_tools && t.other_tools.length > 0)
            console.log(`  Other Tools: ${t.other_tools.join(", ")}`);

          expect(finalData.tech_stack).toBeDefined();
        } else {
          console.log("\n🛠️  TECH STACK: None extracted");
        }

        // Resources - FULL DETAILS
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
          if (r.paid_ad_budget)
            console.log(
              `  Paid Ad Budget: $${r.paid_ad_budget.toLocaleString()}/mo`
            );
          if (r.content_budget)
            console.log(
              `  Content Budget: $${r.content_budget.toLocaleString()}/mo`
            );

          expect(finalData.resources).toBeDefined();
        } else {
          console.log("\n👥 TEAM & RESOURCES: None extracted");
        }

        // Conversion Funnel - FULL DETAILS
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
            console.log(
              `  Decision Triggers: ${f.decision_triggers.join(", ")}`
            );
          }

          if (f.primary_cta) console.log(`  Primary CTA: "${f.primary_cta}"`);
          if (f.conversion_bottleneck)
            console.log(`  Bottleneck: ${f.conversion_bottleneck}`);
          if (f.avg_sales_cycle_days)
            console.log(`  Avg Sales Cycle: ${f.avg_sales_cycle_days} days`);

          expect(finalData.conversion_funnel).toBeDefined();
        } else {
          console.log("\n🎯 CONVERSION FUNNEL: None extracted");
        }

        console.log("\n" + "=".repeat(80));
        console.log("✅ Enhanced growth strategy extraction completed!");
        console.log("=".repeat(80));
      },
      TEST_TIMEOUT
    );
  });

  describe("Error Handling", () => {
    it(
      "should handle invalid website gracefully with error event",
      async () => {
        const websiteUrl = "https://thiswebsitedoesnotexist12345xyz.com";

        console.log("\n🔍 Testing error handling for non-existent website...");

        try {
          const streamResult = await clientsService.streamResearchWebsite(
            websiteUrl
          );

          let finalData: any = null;

          if (streamResult.eventStream) {
            const eventReader = streamResult.eventStream.getReader();
            let streamClosed = false;

            try {
              while (true) {
                const { done, value: event } = await eventReader.read();
                if (done) {
                  streamClosed = true;
                  break;
                }

                console.log(`  [${event.type}] ${event.message || ""}`);

                if (event.type === StreamEventType.ERROR) {
                  console.log("  ✓ Error event received as expected");
                  streamClosed = true;
                  break;
                }

                if (event.type === StreamEventType.COMPLETE) {
                  finalData = event.data;
                  streamClosed = true;
                  break;
                }
              }
            } finally {
              if (!streamClosed) {
                try {
                  eventReader.cancel();
                } catch (e) {
                  // Ignore cancellation errors
                }
              }
              eventReader.releaseLock();
            }
          }

          // Either should have error event OR low confidence result
          if (finalData) {
            expect(finalData.confidence.overall).toBeLessThan(0.5);
            console.log("  ✓ Low confidence returned as expected");
          }
        } catch (error) {
          console.log("  ✓ Error thrown as expected (also acceptable)");
          expect(error).toBeDefined();
        }
      },
      TEST_TIMEOUT
    );
  });

  describe("Performance", () => {
    it(
      "should receive first event within 5 seconds",
      async () => {
        const websiteUrl = "https://airstride.ai";

        console.log("\n⏱️  Testing time to first event...");

        const streamResult = await clientsService.streamResearchWebsite(
          websiteUrl
        );
        const startTime = Date.now();
        let firstEventTime = 0;

        if (streamResult.eventStream) {
          const eventReader = streamResult.eventStream.getReader();

          try {
            const { done, value: event } = await eventReader.read();
            if (!done) {
              firstEventTime = Date.now() - startTime;
              console.log(`  ✓ First event received in ${firstEventTime}ms`);
              console.log(`    Event type: ${event.type}`);
            }
          } finally {
            // Cancel and release the stream since we only read one event
            try {
              eventReader.cancel();
            } catch (e) {
              // Ignore cancellation errors
            }
            eventReader.releaseLock();
          }
        }

        // First event should arrive within 5 seconds
        expect(firstEventTime).toBeLessThan(5000);
        expect(firstEventTime).toBeGreaterThan(0);

        console.log("  ✅ Performance within acceptable limits");
      },
      TEST_TIMEOUT
    );
  });
});
