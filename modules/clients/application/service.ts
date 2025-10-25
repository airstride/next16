/**
 * Clients Module - Service Layer
 *
 * ============================================
 * APPLICATION LAYER - Business Logic
 * ============================================
 *
 * This file contains business logic and orchestration.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/types (IClient, enums)
 * ✅ CAN import: ../api/* (validation, response DTOs)
 * ✅ CAN import: ./factory (same layer)
 * ✅ CAN import: @/shared/services, @/shared/ai-sdk, @/shared/utils
 * ⚠️  CAN import: CLIENT_MODEL_NAME constant from ../infrastructure/schema (only the constant!)
 * ❌ CANNOT import: ClientDocument, mongoose types from ../infrastructure/schema
 * ❌ CANNOT import: Database-specific implementation details
 *
 * WHO CAN IMPORT THIS:
 * ✅ API routes - Service layer is consumed by API
 * ✅ Other services - For service-to-service communication
 * ❌ domain/ - Domain layer has no dependencies
 * ❌ infrastructure/ - Infrastructure depends on domain, not application
 */

import { BaseService } from "@/shared/services/base.service";
import { IClient, ResearchSource } from "../domain/types";
import { CLIENT_MODEL_NAME } from "../infrastructure/schema";
import {
  AIExtractedContext,
  AIExtractedContextSchema,
  CreateClientInput,
  ClientResponse,
  RefineContextInput,
  UpdateClientInput,
  WebsiteUrlInput,
} from "../api/validation";
import {
  generateStructuredOutputWithWebSearch,
  streamStructuredOutputWithWebSearch,
  AIProvider,
  AIModel,
  TemperaturePreset,
  type GenerateStructuredStreamResult,
  MaxTokensPreset,
} from "@/shared/ai-sdk";
import { logger } from "@/shared/utils/logger";
import {
  NotFoundError,
  ValidationError,
  ExternalServiceError,
} from "@/shared/utils/errors";
import { clientFactory } from "./factory";
import { ClientResponseDTO } from "../api/response";

const log = logger.child({ module: "clients-service" });

/**
 * Clients Service
 * Handles AI-powered website research and client context management
 */
export class ClientsService extends BaseService<
  IClient,
  CreateClientInput,
  UpdateClientInput,
  ClientResponse
> {
  constructor() {
    super(CLIENT_MODEL_NAME);
  }

  /**
   * ========================================================================
   * Abstract Method Implementations (Required by BaseService)
   * ========================================================================
   */

  /**
   * Map domain entity to API response format
   * Delegates to ClientResponseDTO for clean transformation
   */
  protected mapEntityToResponse(entity: IClient): ClientResponse {
    return ClientResponseDTO.fromEntity(entity);
  }

  /**
   * Prepare entity data for creation
   * Delegates to ClientFactory for clean transformation
   */
  protected prepareEntityForCreate(
    request: CreateClientInput,
    userId: string,
    orgId: string
  ): IClient {
    return clientFactory.createFromRequest(request, userId, orgId);
  }

  /**
   * Prepare entity data for update
   * Delegates to ClientFactory for clean transformation
   */
  protected prepareEntityForUpdate(
    request: UpdateClientInput,
    userId: string
  ): Partial<IClient> {
    return clientFactory.updateFromRequest(request, userId);
  }

  /**
   * ========================================================================
   * AI-Powered Website Research
   * ========================================================================
   */

  /**
   * Research a website using AI to extract company context
   * Uses ai-sdk's generateStructuredOutputWithWebSearch for intelligent web scraping
   */
  async researchWebsite(websiteUrl: string): Promise<AIExtractedContext> {
    log.info(`Starting AI research for website: ${websiteUrl}`);

    try {
      // Craft comprehensive prompt for website research
      const prompt = this.buildResearchPrompt(websiteUrl);

      // Call AI with web search to extract structured data
      const result = await generateStructuredOutputWithWebSearch({
        prompt,
        schema: AIExtractedContextSchema,
        config: {
          provider: AIProvider.GOOGLE,
          model: AIModel.GEMINI_2_5_PRO, // Cheapest model
          temperature: TemperaturePreset.PRECISE, // 0.3 for factual extraction
          maxTokens: MaxTokensPreset.EXTENDED, // Increased for comprehensive research output
        },
      });

      log.info("AI research completed successfully", {
        websiteUrl,
        confidence: result.object.confidence,
        sources: result.sources?.length || 0,
      });

      return result.object;
    } catch (error) {
      log.error("AI research failed", { websiteUrl, error });

      throw new ExternalServiceError(
        "AI Website Research",
        `Failed to research website: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        {
          websiteUrl,
          originalError: error,
        }
      );
    }
  }

  /**
   * Stream website research with real-time progress updates
   * Uses ai-sdk's streamStructuredOutputWithWebSearch for real-time UX
   *
   * Returns a stream that provides:
   * - Progress events (searching, extracting, etc.)
   * - Partial data updates as they're generated
   * - Final complete data
   *
   * Perfect for showing users what's happening during the research process.
   */
  async streamResearchWebsite(websiteUrl: string): Promise<
    GenerateStructuredStreamResult<AIExtractedContext> & {
      sources?: any;
      searchTextPromise: Promise<string>;
    }
  > {
    log.info(`Starting streaming AI research for website: ${websiteUrl}`);

    try {
      // Craft comprehensive prompt for website research
      const prompt = this.buildResearchPrompt(websiteUrl);

      // Call AI with streaming web search
      const streamResult = await streamStructuredOutputWithWebSearch({
        prompt,
        schema: AIExtractedContextSchema,
        config: {
          provider: AIProvider.GOOGLE,
          model: AIModel.GEMINI_2_5_FLASH_LITE, // Cheapest model
          temperature: TemperaturePreset.PRECISE, // 0.3 for factual extraction
          maxTokens: MaxTokensPreset.EXTENDED, // Increased for comprehensive research output
          enableProgressEvents: true,
          progressMessages: {
            search: `🔍 Researching ${websiteUrl}...`,
            extract: "📊 Extracting company intelligence...",
            complete: "✅ Research completed!",
          },
        },
      });

      // Log completion (happens when objectPromise resolves)
      streamResult.objectPromise
        .then((result) => {
          log.info("Streaming AI research completed successfully", {
            websiteUrl,
            confidence: result.confidence,
          });
        })
        .catch((error) => {
          log.error("Streaming AI research failed", { websiteUrl, error });
        });

      return streamResult;
    } catch (error) {
      log.error("Failed to initiate streaming AI research", {
        websiteUrl,
        error,
      });

      throw new ExternalServiceError(
        "AI Website Research",
        `Failed to start streaming research: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        {
          websiteUrl,
          originalError: error,
        }
      );
    }
  }

  /**
   * Build comprehensive research prompt for AI - MARKETING INTELLIGENCE EDITION
   * Extracts marketing data points to understand founder's business and current state
   */
  private buildResearchPrompt(websiteUrl: string): string {
    // Extract domain from URL for search hints
    const domain = websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

    return `You are a marketing intelligence analyst conducting comprehensive research on an early-stage startup to understand their current marketing state, resources, and opportunities.

**MISSION:**
Research ${websiteUrl} to build a complete picture of this founder's business, marketing presence, and growth stage. Focus on actionable marketing data points that reveal where they are today and what opportunities exist.

**CRITICAL SEARCH STRATEGY:**
Execute these searches systematically (use web search for ALL of these):

**1. COMPANY FUNDAMENTALS:**
- "${domain}" (main website)
- "about ${domain}"
- "${domain} company"
- "${domain} founder" OR "${domain} team"
- "${domain} linkedin company page"
- "${domain} crunchbase" OR "${domain} funding"
- "${domain} launch" OR "${domain} started"

**2. MARKET POSITIONING:**
- "${domain} what is"
- "${domain} pricing"
- "${domain} for [industry/persona]"
- Look at homepage messaging, value props, and taglines
- Identify who they're targeting and what problems they solve

**3. MARKETING PERFORMANCE & METRICS:**
- "${domain} traffic statistics"
- "${domain} similarweb"
- "${domain} monthly visitors"
- "${domain} SEO ranking"
- "${domain} top pages" OR "site:${domain} most popular"
- Look for any public metrics they've shared (MRR, users, downloads, etc.)

**4. CONTENT & CHANNEL PRESENCE:**
- "site:${domain}/blog"
- "site:${domain}/resources"
- "${domain} blog"
- Count: blog posts, resources, videos, podcasts
- Check publishing frequency and recency
- Identify main content themes and topics

**5. SOCIAL MEDIA & COMMUNITY:**
- "${domain} twitter" OR "${domain} x.com"
- "${domain} linkedin"
- "${domain} youtube"
- "${domain} instagram"
- "${domain} facebook"
- Look at follower counts, engagement, posting frequency
- Check for community presence (Slack, Discord, forums)

**6. MARKETING TECH STACK:**
- "${domain} builtwith" OR "${domain} technology stack"
- Look for: CMS (Webflow, WordPress, Framer, Wix, etc.)
- Analytics (GA4, Plausible, Mixpanel, etc.)
- Email tools (Mailchimp, ConvertKit, Beehiiv, etc.)
- Marketing automation (HubSpot, ActiveCampaign, etc.)
- SEO tools, chat widgets, A/B testing tools

**7. TEAM & RESOURCES:**
- "${domain} team size"
- "${domain} employees"
- "${domain} linkedin" (check company page for headcount)
- "${domain} careers" OR "${domain} hiring"
- Identify if they have dedicated marketing, content, or design roles
- Look for signs of founder-led marketing vs. dedicated team

**8. COMPETITIVE LANDSCAPE (Light Touch):**
- "${domain} alternative"
- Identify 2-3 main competitors (name and URL only)
- No deep analysis needed - just awareness of the space

**EXTRACTION INSTRUCTIONS:**

### 1. COMPANY FUNDAMENTALS (Factual - High Confidence Required)
- Company name (from website, meta tags, domain)
- Industry and market vertical
- Company stage (pre-seed → public) - check funding announcements
- Product description (what they do, core value prop in 2-3 sentences)
- Key features (list 5-10 main capabilities or product features)
- Website description (meta description, tagline from homepage)
- Social media presence (LinkedIn, Twitter/X, Facebook, Instagram, YouTube, blog URL)
- Pricing model (free, freemium, subscription, one-time, enterprise - if visible)

### 2. LIGHT COMPETITOR AWARENESS (Don't Over-Index Here)
**Find 2-3 competitors if obvious:**
- Competitor name
- Website URL
- Brief positioning (1 sentence on how they differ)

**NOTE:** This is NOT the focus. Only include if competitors are obvious and easy to find.

### 3. MARKETING PERFORMANCE METRICS (Critical for Early-Stage Context!)
- Monthly traffic estimate (from SimilarWeb, Ahrefs, or infer from signals)
- Traffic sources breakdown (Organic %, Direct %, Referral %, Social %, Paid %)
- Top performing pages (homepage, pricing, blog posts with most traction)
- Top SEO keywords (what they rank for - if data available)
- Social media metrics:
  - Twitter/X followers + engagement level
  - LinkedIn followers + posting frequency
  - YouTube subscribers (if applicable)
  - Instagram followers (if applicable)
- Email list size indicators (if mentioned: "10K+ subscribers", etc.)
- Public growth metrics (if mentioned: "used by X companies", "Y downloads", etc.)

**IMPORTANT:** For early-stage startups, these metrics might be small or non-existent. That's valuable data!

### 4. CONTENT INVENTORY & STRATEGY (Count Everything!)
- Total blog posts (count from site:${domain}/blog or blog page)
- Total resources (ebooks, guides, templates, tools)
- Total case studies or customer stories
- Total videos (YouTube or embedded)
- Total podcasts (if they have one)
- Publishing frequency:
  - Blog: "3x/week", "weekly", "bi-weekly", "monthly", "sporadic", "inactive"
  - Social: "daily", "2-3x/week", "weekly", "sporadic"
- Last published date (when was latest content published?)
- Content themes (main topics: "SEO guides", "Product updates", "Industry trends", etc.)
- Content quality signals (depth, polish, engagement indicators)

### 5. MARKETING TECH STACK (What Tools Are They Using?)
- CMS platform (Webflow, WordPress, Framer, Contentful, Wix, Squarespace, Next.js, Custom)
- Analytics tools (Google Analytics 4, Plausible, Mixpanel, Amplitude, Fathom)
- Email platform (Mailchimp, SendGrid, ConvertKit, Beehiiv, Klaviyo, Customer.io)
- CRM system (HubSpot, Salesforce, Pipedrive, Close, Notion)
- Marketing automation (HubSpot, ActiveCampaign, Marketo, etc.)
- Social scheduling (Buffer, Hootsuite, Later, Typefully)
- SEO tools (Ahrefs, SEMrush, Moz - look for mentions)
- Other tools (chat widgets like Intercom, A/B testing, heatmaps, forms)

**Search for:** BuiltWith data, tool mentions in blog/docs, integrations page, footer badges

### 6. TEAM & RESOURCES (Critical for Understanding Capacity!)
- Total team size (from LinkedIn, About page, careers page)
- Founder-led? (Is this still founder doing marketing? Look for founder activity on social)
- Marketing team size (look for marketing, growth, or content roles on LinkedIn)
- Content team size (content writers, creators, designers)
- Has in-house design? (boolean)
- Has in-house dev? (boolean)
- Marketing maturity indicators:
  - "Solo founder doing everything"
  - "Founder + 1-2 helping with content"
  - "Dedicated marketer/growth person"
  - "Full marketing team (3+)"
- Budget indicators (rarely public - only if explicitly mentioned)

### 7. IDEAL CUSTOMER PROFILE (ICP) - Who Are They Targeting?
- Description (who is the product built for? Be specific)
- Target personas (job titles: "Founders", "Marketing Managers", "Developers", etc.)
- Target company size ("solopreneurs", "startups (1-10)", "SMBs (10-50)", "mid-market (50-200)", "enterprise (200+)")
- Target industries (list 2-5 verticals if applicable)
- Pain points they solve (3-5 key problems based on messaging)
- Use cases (how customers use the product)

### 8. BRAND VOICE & MESSAGING
- Tone (professional, casual, technical, conversational, playful, authoritative, founder-voice)
- Style (educational, sales-focused, storytelling, thought-leadership, community-driven)
- Brand keywords (5-10 words/phrases they use frequently in messaging)
- Unique angles (what makes their messaging different or memorable?)

### 9. CONVERSION & MONETIZATION STRATEGY
- Primary CTA (main call-to-action: "Start Free Trial", "Get Started", "Book Demo", "Join Waitlist", "Download")
- Conversion path (how do users become customers?)
  - Self-service signup?
  - Demo/sales call required?
  - Waitlist/beta?
  - Free tier → paid upgrade?
- Lead magnets (free tools, ebooks, templates, calculators, etc.)
- Pricing page presence (do they show pricing publicly?)
- Trial/freemium available? (if yes, what's the model?)

### 10. MARKETING MATURITY ASSESSMENT (Strategic Insights!)
Assess their marketing sophistication across these dimensions:

**Content Marketing:**
- "non-existent" (no blog/content)
- "nascent" (few posts, sporadic)
- "developing" (regular posts, 10-50 pieces)
- "established" (100+ posts, consistent publishing)

**SEO:**
- "none" (no visible SEO effort)
- "basic" (some keywords, basic meta tags)
- "intermediate" (clear keyword strategy, decent rankings)
- "advanced" (strong domain authority, top rankings)

**Social Media:**
- "inactive" (no presence or abandoned accounts)
- "minimal" (accounts exist but low activity)
- "active" (regular posting, some engagement)
- "strong" (consistent posting, strong engagement, growing audience)

**Email Marketing:**
- "none" (no email capture visible)
- "basic" (newsletter signup only)
- "active" (regular newsletters, lead nurturing)
- "sophisticated" (segmentation, automation, multi-touch sequences)

**Paid Marketing:**
- Look for signs: sponsored posts, ad creative, retargeting pixels
- "none", "minimal", "active", "heavy"

**Overall Marketing Stage:**
- "pre-marketing" (product-focused, minimal marketing presence)
- "founder-led" (founder driving awareness, no dedicated marketer)
- "early-stage" (first marketing hire, building foundation)
- "growth-stage" (team in place, multiple channels active)

### 11. GROWTH OPPORTUNITIES & GAPS (What's Missing or Underutilized?)
Identify quick wins and gaps:
- Missing channels (e.g., "No blog despite good expertise")
- Inactive channels (e.g., "Twitter account but last post 6 months ago")
- Content gaps (e.g., "No case studies despite claiming 100+ customers")
- SEO opportunities (e.g., "Good content but poor SEO optimization")
- Conversion gaps (e.g., "Traffic but unclear CTA")
- Consistency issues (e.g., "Strong start then publishing stopped")

### 12. CONFIDENCE SCORING
Rate confidence 0-1 for each category:
- **overall**: Combined confidence across all data
- **factual**: Confidence in hard facts (company name, features, URLs, team size)
- **inferred**: Confidence in strategic insights (ICP, marketing maturity, opportunities)

**Scoring Guidelines:**
- 0.9-1.0: Established company with strong web presence and public data
- 0.7-0.8: Active company with decent marketing footprint
- 0.5-0.6: Early-stage with some presence but limited public data
- 0.3-0.4: Very early-stage, minimal footprint, heavy inference needed
- 0.0-0.2: Website is parking page, under construction, or non-existent

### 13. RESEARCH NOTES
Document your research process:
- Website status (live, under construction, non-existent, parking page)
- What was factual vs. inferred
- Data gaps and what's missing
- Notable findings (anything surprising or particularly relevant)
- Data sources used (LinkedIn, Crunchbase, BuiltWith, SimilarWeb, etc.)
- Confidence caveats (e.g., "traffic estimate based on content volume and social signals")
- Recommendations for follow-up research

**OUTPUT FORMAT:**
Return complete JSON matching the schema. For missing data:
- Use empty arrays [] for list fields
- Use null/undefined for optional scalar fields
- NEVER invent data - be honest about gaps
- Use confidence scores to indicate data quality
- Document what you couldn't find in research notes

**SPECIAL CASES:**
- **No website/parking page**: Return minimal data with 0.1 confidence, note in research_notes
- **Very early-stage/stealth**: Search for founder LinkedIn, any press/Product Hunt launches, limited data is OK
- **Limited traffic data**: Infer from: content volume, social following, team size, funding stage
- **No tech stack data**: Check BuiltWith, page source, look for tool badges/mentions
- **Founder-led marketing**: This is common and valuable insight - document it clearly

**YOUR GOAL:**
Extract enough marketing intelligence to understand where this founder is TODAY with their marketing, what resources they have, and what opportunities exist. This data will inform personalized strategy recommendations.

Focus on ACTIONABLE DATA for early-stage startups. Be honest about gaps. Quality over quantity.

Begin comprehensive research now.`;
  }

  /**
   * ========================================================================
   * Client Management Methods
   * ========================================================================
   */

  /**
   * Create client from website URL (AI-powered research + creation)
   */
  async createClientFromWebsite(
    websiteUrl: string,
    userId: string,
    organizationId?: string
  ): Promise<ClientResponse> {
    log.info("Creating client from website", {
      website_url: websiteUrl,
      user_id: userId,
    });

    // Step 1: Research website using AI
    const extractedContext = await this.researchWebsite(websiteUrl);

    // Step 2: Create branded input for factory
    const input: WebsiteUrlInput = {
      website_url: websiteUrl,
      user_id: userId,
      organization_id: organizationId,
    } as WebsiteUrlInput;

    // Step 3: Transform AI data to domain entity using factory
    const clientData = clientFactory.createFromAIResearch(
      extractedContext,
      input
    );

    // Step 4: Save to database (repository handles implementation details)
    const createdClient = await this.repository.create(clientData);

    log.info("Client created from AI research", {
      clientId: String(createdClient._id),
      confidence: extractedContext.confidence.overall,
    });

    return this.mapEntityToResponse(createdClient);
  }

  /**
   * Create client manually (no AI research)
   */
  async createClient(
    request: CreateClientInput,
    userId: string,
    orgId: string
  ): Promise<ClientResponse> {
    log.info("Creating client manually", { user_id: userId });

    const clientData = this.prepareEntityForCreate(request, userId, orgId);
    const createdClient = await this.repository.create(clientData);

    log.info("Manual client created", {
      clientId: String(createdClient._id),
    });

    return this.mapEntityToResponse(createdClient);
  }

  /**
   * Get client context by ID
   */
  async getClientContext(clientId: string): Promise<ClientResponse> {
    log.debug("Fetching client context", { clientId });

    const client = await this.repository.findById(clientId);

    if (!client) {
      throw new NotFoundError(`Client not found with ID: ${clientId}`);
    }

    return this.mapEntityToResponse(client);
  }

  /**
   * Update client context
   */
  async updateContext(
    clientId: string,
    updates: UpdateClientInput,
    updatedBy?: string
  ): Promise<ClientResponse> {
    log.info("Updating client context", { clientId });

    // Fetch existing client
    const existingClient = await this.repository.findById(clientId);

    if (!existingClient) {
      throw new NotFoundError(`Client not found with ID: ${clientId}`);
    }

    // Prepare update data
    const updateData = this.prepareEntityForUpdate(updates, updatedBy || "");

    // If updating AI-researched fields, mark as mixed source
    if (
      existingClient.research_metadata.source === ResearchSource.AI &&
      Object.keys(updateData).length > 0
    ) {
      updateData.research_metadata = {
        ...existingClient.research_metadata,
        source: ResearchSource.MIXED,
      } as any;
    }

    // Add updatedBy if provided
    if (updatedBy) {
      updateData.updated_by = updatedBy;
    }

    // Update client
    const updatedClient = await this.repository.updateById(
      clientId,
      updateData
    );

    if (!updatedClient) {
      throw new NotFoundError(
        `Client not found after update with ID: ${clientId}`
      );
    }

    log.info("Client context updated", { clientId });

    return this.mapEntityToResponse(updatedClient);
  }

  /**
   * Refine AI-extracted context (user overrides AI data)
   */
  async refineContext(
    clientId: string,
    refinements: RefineContextInput,
    refinedBy?: string
  ): Promise<ClientResponse> {
    log.info("Refining AI-extracted context", { clientId });

    // Fetch existing client
    const existingClient = await this.repository.findById(clientId);

    if (!existingClient) {
      throw new NotFoundError(`Client not found with ID: ${clientId}`);
    }

    // Ensure client was AI-researched
    if (existingClient.research_metadata.source === ResearchSource.MANUAL) {
      throw new ValidationError(
        "Cannot refine manually created client. Use updateContext instead."
      );
    }

    // Merge refinements with existing data using factory
    const updateData = clientFactory.mergeRefinements(
      existingClient,
      refinements
    );

    // Add refinement notes if provided
    if (refinements.refinement_notes) {
      updateData.research_metadata = {
        ...existingClient.research_metadata,
        ...updateData.research_metadata,
        research_notes: `${
          existingClient.research_metadata.research_notes || ""
        }\n\nUser Refinements: ${refinements.refinement_notes}`.trim(),
      } as any;
    }

    if (refinedBy) {
      updateData.updated_by = refinedBy;
    }

    // Update client
    const updatedClient = await this.repository.updateById(
      clientId,
      updateData
    );

    if (!updatedClient) {
      throw new NotFoundError(
        `Client not found after refinement with ID: ${clientId}`
      );
    }

    log.info("Client context refined", { clientId });

    return this.mapEntityToResponse(updatedClient);
  }

  /**
   * Find clients by user
   */
  async findClientsByUser(userId: string): Promise<ClientResponse[]> {
    log.debug("Finding clients by user", { userId });

    const [clients] = await this.repository.find({
      user_id: userId,
    });

    return clients.map((p) => this.mapEntityToResponse(p));
  }

  /**
   * Find clients by organization
   */
  async findClientsByOrganization(
    organizationId: string
  ): Promise<ClientResponse[]> {
    log.debug("Finding clients by organization", { organizationId });

    const [clients] = await this.repository.find({
      organization_id: organizationId,
    });

    return clients.map((p) => this.mapEntityToResponse(p));
  }

  /**
   * ========================================================================
   * Business Logic Methods (Domain logic as service methods)
   * ========================================================================
   */

  /**
   * Check if client has been AI-researched
   * @param client - The client entity to check
   * @returns True if client was researched by AI (fully or partially)
   */
  isAIResearched(client: IClient): boolean {
    return (
      client.research_metadata?.source === ResearchSource.AI ||
      client.research_metadata?.source === ResearchSource.MIXED
    );
  }

  /**
   * Get research quality score based on confidence level
   * @param client - The client entity to evaluate
   * @returns Quality rating: 'high' (≥0.8), 'medium' (≥0.5), or 'low' (<0.5)
   */
  getResearchQuality(client: IClient): "high" | "medium" | "low" {
    const confidence = client.research_metadata?.confidence || 0;
    if (confidence >= 0.8) return "high";
    if (confidence >= 0.5) return "medium";
    return "low";
  }

  /**
   * Calculate client age in days since creation
   * @param client - The client entity
   * @returns Age in days (integer)
   */
  getClientAge(client: IClient): number {
    return Math.floor(
      (Date.now() - new Date(client.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }
}

/**
 * Export singleton instance
 */
export const clientsService = new ClientsService();
