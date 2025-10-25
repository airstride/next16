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
          model: AIModel.GEMINI_2_5_FLASH,
          temperature: TemperaturePreset.PRECISE, // 0.3 for factual extraction
          maxTokens: 4096,
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
          model: AIModel.GEMINI_2_5_FLASH,
          temperature: TemperaturePreset.PRECISE, // 0.3 for factual extraction
          maxTokens: 4096,
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
   * Build comprehensive research prompt for AI - GROWTH HACKER EDITION
   * Extracts everything needed for a data-driven 30-day growth strategy
   */
  private buildResearchPrompt(websiteUrl: string): string {
    // Extract domain from URL for search hints
    const domain = websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

    return `You are an elite growth hacker and business analyst conducting COMPREHENSIVE competitive intelligence and growth strategy research.

**MISSION:**
Research ${websiteUrl} and extract EVERYTHING needed to build a killer 30-day growth marketing strategy. This means: company basics, competitive landscape, current performance, content strategy, tech stack, resources, and conversion funnel.

**CRITICAL SEARCH STRATEGY:**
Execute these searches systematically (use web search for ALL of these):

**1. COMPANY BASICS:**
- "${domain}" (main website)
- "about ${domain}"
- "${domain} company"
- "${domain} linkedin company page"
- "${domain} crunchbase" OR "${domain} funding"
- "${domain} team size"

**2. COMPETITIVE INTELLIGENCE:**
- "${domain} competitors"
- "${domain} vs [competitor name]" (find top 3-5 competitors)
- "${domain} alternative"
- "best ${domain} alternatives"
- "${domain} comparison"
- Search SimilarWeb/Ahrefs data for competitor traffic

**3. PERFORMANCE & TRAFFIC:**
- "site:${domain} analytics"
- "${domain} traffic statistics"
- "${domain} similarweb"
- "${domain} monthly visitors"
- "${domain} SEO ranking"
- "${domain} top pages" OR "site:${domain} most popular"

**4. CONTENT INVENTORY:**
- "site:${domain}/blog"
- "site:${domain}/resources"
- "site:${domain}/case-studies"
- "${domain} content marketing"
- "${domain} blog publishing frequency"
- Count blog posts, case studies, whitepapers, videos

**5. TECH STACK & TOOLS:**
- "${domain} builtwith" OR "${domain} technology stack"
- "${domain} uses [CMS/tool]"
- Check for: Webflow, WordPress, Contentful, HubSpot, Salesforce, etc.
- Look for analytics tools (GA4, Plausible, Mixpanel)
- Email platforms (Mailchimp, SendGrid, Customer.io)
- SEO tools mentions

**6. TEAM & RESOURCES:**
- "${domain} team size"
- "${domain} employees"
- "${domain} linkedin" (check company page for headcount)
- "${domain} careers" OR "${domain} hiring"
- Look for marketing team size indicators

**7. CONVERSION FUNNEL:**
- Main CTAs on homepage
- "site:${domain}/pricing"
- "site:${domain}/demo"
- "site:${domain}/signup" OR "site:${domain}/trial"
- Lead magnets (ebooks, webinars, tools)

**EXTRACTION INSTRUCTIONS:**

### 1. COMPANY FUNDAMENTALS (Factual - High Confidence Required)
- Company name (from website, meta tags, domain)
- Industry and market vertical
- Company stage (pre-seed → public) - check funding announcements
- Product description (what they do, core value prop)
- Key features (list 5-10 main capabilities)
- Social media presence (LinkedIn, Twitter, Facebook, Instagram, YouTube, blog URL)
- Website description (meta description, tagline)

### 2. COMPETITOR INTELLIGENCE (Research Thoroughly!)
**Find 3-5 main competitors and for EACH extract:**
- Competitor name
- Website URL
- Positioning statement (how they position vs this company)
- Strengths (what they do better - 2-3 points)
- Weaknesses (gaps to exploit - 2-3 points)
- Estimated monthly traffic (from SimilarWeb data if available)

**CRITICAL:** This data is GOLD for growth strategy. Search extensively!

### 3. CURRENT PERFORMANCE METRICS (Infer from available data)
- Monthly traffic estimate (from SimilarWeb, Ahrefs mentions, or infer from content volume)
- Traffic sources breakdown (Organic, Direct, Referral, Social, Paid - percentages)
- Top performing pages (most linked, most mentioned URLs)
- Top SEO keywords (what they rank for - from Ahrefs/SEMrush data or infer)
- Bounce rate (if mentioned anywhere)
- Average session duration (if mentioned)
- Monthly leads estimate (infer from scale indicators)
- Conversion rate (if publicly mentioned - rare but check case studies)

**Note:** Use confidence scoring appropriately - traffic data is often inferred.

### 4. CONTENT INVENTORY (Count & Categorize)
- Total blog posts (count from site:${domain}/blog search)
- Total case studies (search for case study pages)
- Total whitepapers/ebooks (search resources/downloads)
- Total videos (YouTube channel, site:${domain}/video)
- Total podcasts (if they have one)
- Top performing content URLs (most shared/linked)
- Publishing frequency ("2x/week", "weekly", "monthly", "sporadic")
- Last published date (check latest blog post date)
- Content themes (main topics they cover - 3-5 themes)

### 5. MARKETING TECH STACK (Detective Work!)
- CMS platform (Webflow, WordPress, Contentful, Wix, Squarespace, Custom)
- Analytics tools (Google Analytics 4, Plausible, Mixpanel, Amplitude)
- Email platform (Mailchimp, SendGrid, Customer.io, Klaviyo, ConvertKit)
- CRM system (HubSpot, Salesforce, Pipedrive, Close)
- Social scheduling (Buffer, Hootsuite, Later, Sprout Social)
- Marketing automation (Marketo, Pardot, ActiveCampaign, Autopilot)
- SEO tools mentioned (Ahrefs, SEMrush, Moz)
- Other tools (chat widgets, A/B testing, heatmaps, etc.)

**Search for:** BuiltWith data, tool mentions in blog posts, integrations pages

### 6. TEAM & RESOURCES (LinkedIn is key!)
- Total team size (from LinkedIn company page, About page, careers page)
- Marketing team size (estimate from LinkedIn job titles)
- Content writers (how many content creators? Check LinkedIn)
- Has in-house design? (boolean - check for design roles)
- Has in-house dev? (boolean - check for engineering team)
- Monthly marketing budget (rarely public - only include if explicitly mentioned)
- Paid ad budget (rarely public - only if mentioned)
- Content budget (rarely public - only if mentioned)

### 7. IDEAL CUSTOMER PROFILE (ICP) - Strategic Inference
- Description (who is the product for?)
- Pain points they solve (3-5 key problems)
- Demographics (job titles, company sizes, industries)
- Target company size ("startups", "SMBs", "enterprise", "10-50 employees")
- Target industries (list 3-5 verticals they focus on)

### 8. BUSINESS GOALS (Infer from messaging & positioning)
- Traffic target (infer from current scale + growth messaging)
- Leads target (infer from funnel indicators)
- Revenue target (only if public - e.g., ARR mentioned)
- Demo target (if they push demos)
- Other goals (brand awareness, market education, etc.)

### 9. BRAND VOICE & STYLE
- Tone (professional, casual, technical, conversational, playful, authoritative)
- Style (educational, sales-driven, storytelling, thought-leadership)
- Keywords they use frequently (5-10 brand keywords)
- Brand guidelines (any explicit mentions of voice/style)

### 10. CONVERSION FUNNEL (Critical for growth!)
- Awareness channels (where they drive traffic: SEO, Paid Ads, Social, Content, Partnerships)
- Consideration assets (what moves prospects: Case Studies, Product Demo, Free Trial, Webinars, Ebooks)
- Decision triggers (what closes deals: Pricing Page, Demo Call, Sales Contact, Free Trial Signup)
- Primary CTA (main call-to-action: "Book a Demo", "Start Free Trial", "Get Started", "Contact Sales")
- Conversion bottleneck (where people drop off - infer from funnel design)
- Average sales cycle (if mentioned - days from first touch to close)

### 11. CONFIDENCE SCORING
Rate confidence 0-1 for each category:
- **overall**: Combined confidence across all data
- **factual**: Confidence in hard facts (company name, features, URLs)
- **inferred**: Confidence in strategic insights (ICP, goals, competitors)

**Scoring Guidelines:**
- 0.9-1.0: Public company with tons of data available
- 0.7-0.8: Established company with good web presence
- 0.5-0.6: Early-stage with limited public data
- 0.3-0.4: Minimal information, heavy inference required
- 0.0-0.2: Website doesn't exist or is parking page

### 12. RESEARCH NOTES
Document your research process:
- Website status (live, under construction, non-existent, parking)
- What was factual vs inferred
- Data gaps and ambiguities
- Suggestions for manual review
- Alternative sources used (LinkedIn, Crunchbase, BuiltWith, etc.)
- Confidence caveats (e.g., "traffic estimate based on content volume")

**OUTPUT FORMAT:**
Return complete JSON matching the schema. For missing data:
- Use empty arrays [] for list fields
- Use null/undefined for optional scalar fields
- NEVER invent data - be honest about gaps
- Use confidence scores to indicate data quality

**SPECIAL CASES:**
- **No website/parking page**: Return minimal data with 0.1 confidence
- **Early-stage stealth**: Search for founder LinkedIn, press releases, limited data OK
- **No competitor data**: Search harder - there are ALWAYS competitors
- **No traffic data**: Infer from: content volume, social following, team size, funding
- **No tech stack data**: Check BuiltWith, look for tool mentions in content

**YOUR GOAL:**
Extract enough intelligence that a growth hacker can immediately build a data-driven 30-day strategy WITHOUT needing to research the company again.

Begin comprehensive research now. Leave NO stone unturned.`;
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
