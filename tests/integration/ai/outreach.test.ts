/**
 * @jest-environment node
 */

/**
 * Integration Test: Outreach Message Generation
 *
 * Tests the AI-powered personalized outreach message generation.
 * Validates message quality and personalization.
 */

import { AIModel, AIProvider, generateStructuredOutput } from "@/lib/ai-sdk";
import { generateOutreachMessagePrompt } from "@/lib/ai-sdk/prompts";
import { OutreachMessageSchema } from "@/lib/ai-sdk/schemas/outreach.schema";
import { AIPersonality, PERSONALITY_CONFIG } from "@/lib/ai-sdk/types";

describe("Outreach Message Generation Integration Test", () => {
  const TEST_TIMEOUT = 90000;

  it(
    "should generate personalized outreach message with different personalities",
    async () => {
      const testInput = {
        contactName: "Sarah Johnson",
        partnerCompany: "TechCorp Solutions",
      };

      // Test with different personalities
      const personalities = [
        AIPersonality.PROFESSIONAL,
        AIPersonality.FRIENDLY,
        AIPersonality.ENTHUSIASTIC,
        AIPersonality.CONCISE,
      ];

      console.log("🔍 Starting outreach message generation test with varying personalities...");
      console.log(`  Contact: ${testInput.contactName}`);
      console.log(`  Company: ${testInput.partnerCompany}`);
      console.log("");

      for (const personality of personalities) {
        const personalityConfig = PERSONALITY_CONFIG[personality];
        const prompt = generateOutreachMessagePrompt({
          ...testInput,
          personalityInstruction: personalityConfig.promptInstruction,
        });

        console.log(`\n${"=".repeat(80)}`);
        console.log(`🎭 Testing with personality: ${personalityConfig.label}`);
        console.log(`   ${personalityConfig.description}`);
        console.log(`${"=".repeat(80)}\n`);

        const startTime = Date.now();

        const result = await generateStructuredOutput({
          prompt,
          schema: OutreachMessageSchema,
          config: {
            provider: AIProvider.GOOGLE,
            model: AIModel.GEMINI_2_5_FLASH_LITE,
            temperature: 0.7,
            maxTokens: 1000,
          },
        });

        const duration = Date.now() - startTime;

        console.log(`✅ Message generated in ${(duration / 1000).toFixed(2)}s`);
        console.log("📊 Metadata:");
        console.log(`  Subject: ${result.object.subject}`);
        console.log(`  Tone: ${result.object.tone}`);
        console.log(`  Message length: ${result.object.message.length} chars`);
        console.log("");
        console.log("📝 Generated Message:\n");
        console.log(result.object.message);
        console.log("");

        // Validate response structure
        expect(result.object.subject).toBeDefined();
        expect(result.object.subject.length).toBeGreaterThan(10);
        expect(result.object.message).toBeDefined();
        expect(result.object.message.length).toBeGreaterThan(50);
        expect(result.object.tone).toBeDefined();
        expect(["PROFESSIONAL", "CASUAL", "FORMAL"]).toContain(result.object.tone);

        // Should mention contact name (first name, last name, or full name)
        const messageLower = result.object.message.toLowerCase();
        const nameParts = testInput.contactName.toLowerCase().split(" ");
        const mentionsName = nameParts.some((part) => messageLower.includes(part));
        expect(mentionsName).toBe(true);

        expect(duration).toBeLessThan(TEST_TIMEOUT);
      }
    },
    TEST_TIMEOUT * 4 // Multiply timeout since we're running 4 tests
  );

  it(
    "should generate multiple unique messages for different contacts",
    async () => {
      const contacts = [
        { contactName: "John Smith", partnerCompany: "DataCo" },
        { contactName: "Emily Chen", partnerCompany: "CloudSystems" },
        { contactName: "Michael Brown", partnerCompany: "FinTech Innovations" },
      ];

      const messages = [];

      for (const contact of contacts) {
        const prompt = generateOutreachMessagePrompt(contact);

        console.log(`🔍 Generating for: ${contact.contactName} at ${contact.partnerCompany}`);

        const result = await generateStructuredOutput({
          prompt,
          schema: OutreachMessageSchema,
          config: {
            provider: AIProvider.GOOGLE,
            model: AIModel.GEMINI_2_5_FLASH_LITE,
            temperature: 0.7,
            maxTokens: 1000,
          },
        });

        console.log(`  ✅ Generated: ${result.object.subject}`);

        messages.push(result.object.message);

        expect(result.object.subject).toBeDefined();
        expect(result.object.message).toBeDefined();
      }

      // Messages should be different from each other
      expect(messages[0]).not.toBe(messages[1]);
      expect(messages[1]).not.toBe(messages[2]);
      expect(messages[0]).not.toBe(messages[2]);
    },
    TEST_TIMEOUT
  );
});
