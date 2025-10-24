/**
 * Projects Module - Service Layer
 *
 * ============================================
 * APPLICATION LAYER - Business Logic
 * ============================================
 *
 * This file contains business logic and orchestration.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/types (IProject, enums)
 * ✅ CAN import: ../api/* (validation, response DTOs)
 * ✅ CAN import: ./factory (same layer)
 * ✅ CAN import: @/shared/services, @/shared/ai-sdk, @/shared/utils
 * ⚠️  CAN import: PROJECT_MODEL_NAME constant from ../infrastructure/schema (only the constant!)
 * ❌ CANNOT import: ProjectDocument, mongoose types from ../infrastructure/schema
 * ❌ CANNOT import: Database-specific implementation details
 *
 * WHO CAN IMPORT THIS:
 * ✅ API routes - Service layer is consumed by API
 * ✅ Other services - For service-to-service communication
 * ❌ domain/ - Domain layer has no dependencies
 * ❌ infrastructure/ - Infrastructure depends on domain, not application
 */

import { BaseService } from "@/shared/services/base.service";
import { IProject, ResearchSource } from "../domain/types";
import { PROJECT_MODEL_NAME } from "../infrastructure/schema";
import {
  AIExtractedContext,
  AIExtractedContextSchema,
  CreateProjectInput,
  ProjectResponse,
  RefineContextInput,
  UpdateProjectInput,
  WebsiteUrlInput,
} from "../api/validation";
import {
  generateStructuredOutputWithWebSearch,
  AIProvider,
  AIModel,
  TemperaturePreset,
} from "@/shared/ai-sdk";
import { logger } from "@/shared/utils/logger";
import {
  NotFoundError,
  ValidationError,
  ExternalServiceError,
} from "@/shared/utils/errors";
import { projectFactory } from "./factory";
import { ProjectResponseDTO } from "../api/response";

const log = logger.child({ module: "projects-service" });

/**
 * Projects Service
 * Handles AI-powered website research and project context management
 */
export class ProjectsService extends BaseService<
  IProject,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectResponse
> {
  constructor() {
    super(PROJECT_MODEL_NAME);
  }

  /**
   * ========================================================================
   * Abstract Method Implementations (Required by BaseService)
   * ========================================================================
   */

  /**
   * Map domain entity to API response format
   * Delegates to ProjectResponseDTO for clean transformation
   */
  protected mapEntityToResponse(entity: IProject): ProjectResponse {
    return ProjectResponseDTO.fromProject(entity);
  }

  /**
   * Prepare entity data for creation
   * Delegates to ProjectFactory for clean transformation
   */
  protected prepareEntityForCreate(
    request: CreateProjectInput,
    userId: string,
    orgId: string
  ): IProject {
    return projectFactory.createFromRequest(request, userId, orgId);
  }

  /**
   * Prepare entity data for update
   * Delegates to ProjectFactory for clean transformation
   */
  protected prepareEntityForUpdate(
    request: UpdateProjectInput,
    userId: string
  ): Partial<IProject> {
    return projectFactory.updateFromRequest(request, userId);
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
   * Build comprehensive research prompt for AI
   */
  private buildResearchPrompt(websiteUrl: string): string {
    return `You are an expert business analyst conducting comprehensive company research.

**Your Task:**
Research the website ${websiteUrl} and extract detailed company context for marketing strategy development.

**Instructions:**

1. **Factual Data Extraction** (High Confidence Required):
   - Company name (from website, meta tags, or content)
   - Industry and market sector
   - Company stage (pre-seed, seed, series-a, etc.) - infer from team size, funding mentions, or maturity indicators
   - Product/service description
   - Key product features and capabilities
   - Social media handles and marketing asset URLs

2. **Strategic Insights** (Inference Allowed):
   - Target customer profile (ICP):
     * Who is this product/service for?
     * What pain points does it solve?
     * What demographics or company sizes do they target?
     * What industries do they serve?
   
   - Business goals (infer from messaging):
     * Growth focus (traffic, leads, revenue, demos)?
     * Scale indicators from their positioning
   
   - Brand voice analysis:
     * Tone (professional, casual, technical, playful, etc.)
     * Style (educational, sales-driven, storytelling, etc.)
     * Key messaging themes and keywords
     * Brand guidelines visible in their content

3. **Confidence Scoring:**
   - Rate your confidence in the extraction:
     * overall: 0-1 (combined confidence)
     * factual: 0-1 (confidence in hard facts like name, URLs, features)
     * inferred: 0-1 (confidence in strategic insights like ICP, goals, voice)
   
   - Be honest: if information is unclear or missing, score lower confidence
   - Mark what you're certain about vs. what you're inferring

4. **Research Notes:**
   - Add notes about:
     * What data was clearly stated vs. inferred
     * Any ambiguities or missing information
     * Suggestions for manual review

**Output Requirements:**
- Return structured JSON matching the schema
- Use empty arrays [] for missing list fields
- Use null/undefined for missing optional fields
- Be thorough but honest about confidence levels
- Prioritize accuracy over completeness

**Example Scenarios:**
- If no social media links found → return empty strings, note in researchNotes
- If company stage unclear → make best inference, mark lower inferredConfidence
- If ICP ambiguous → provide general description, note uncertainty

Begin research now.`;
  }

  /**
   * ========================================================================
   * Project Management Methods
   * ========================================================================
   */

  /**
   * Create project from website URL (AI-powered research + creation)
   */
  async createProjectFromWebsite(
    websiteUrl: string,
    userId: string,
    organizationId?: string
  ): Promise<ProjectResponse> {
    log.info("Creating project from website", {
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
    const projectData = projectFactory.createFromAIResearch(
      extractedContext,
      input
    );

    // Step 4: Save to database (repository handles implementation details)
    const createdProject = await this.repository.create(projectData);

    log.info("Project created from AI research", {
      projectId: String(createdProject._id),
      confidence: extractedContext.confidence.overall,
    });

    return this.mapEntityToResponse(createdProject);
  }

  /**
   * Create project manually (no AI research)
   */
  async createProject(
    request: CreateProjectInput,
    userId: string,
    orgId: string
  ): Promise<ProjectResponse> {
    log.info("Creating project manually", { user_id: userId });

    const projectData = this.prepareEntityForCreate(request, userId, orgId);
    const createdProject = await this.repository.create(projectData);

    log.info("Manual project created", {
      projectId: String(createdProject._id),
    });

    return this.mapEntityToResponse(createdProject);
  }

  /**
   * Get project context by ID
   */
  async getProjectContext(projectId: string): Promise<ProjectResponse> {
    log.debug("Fetching project context", { projectId });

    const project = await this.repository.findById(projectId);

    if (!project) {
      throw new NotFoundError(`Project not found with ID: ${projectId}`);
    }

    return this.mapEntityToResponse(project);
  }

  /**
   * Update project context
   */
  async updateContext(
    projectId: string,
    updates: UpdateProjectInput,
    updatedBy?: string
  ): Promise<ProjectResponse> {
    log.info("Updating project context", { projectId });

    // Fetch existing project
    const existingProject = await this.repository.findById(projectId);

    if (!existingProject) {
      throw new NotFoundError(`Project not found with ID: ${projectId}`);
    }

    // Prepare update data
    const updateData = this.prepareEntityForUpdate(updates, updatedBy || "");

    // If updating AI-researched fields, mark as mixed source
    if (
      existingProject.research_metadata.source === ResearchSource.AI &&
      Object.keys(updateData).length > 0
    ) {
      updateData.research_metadata = {
        ...existingProject.research_metadata,
        source: ResearchSource.MIXED,
      } as any;
    }

    // Add updatedBy if provided
    if (updatedBy) {
      updateData.updated_by = updatedBy;
    }

    // Update project
    const updatedProject = await this.repository.updateById(
      projectId,
      updateData
    );

    if (!updatedProject) {
      throw new NotFoundError(
        `Project not found after update with ID: ${projectId}`
      );
    }

    log.info("Project context updated", { projectId });

    return this.mapEntityToResponse(updatedProject);
  }

  /**
   * Refine AI-extracted context (user overrides AI data)
   */
  async refineContext(
    projectId: string,
    refinements: RefineContextInput,
    refinedBy?: string
  ): Promise<ProjectResponse> {
    log.info("Refining AI-extracted context", { projectId });

    // Fetch existing project
    const existingProject = await this.repository.findById(projectId);

    if (!existingProject) {
      throw new NotFoundError(`Project not found with ID: ${projectId}`);
    }

    // Ensure project was AI-researched
    if (existingProject.research_metadata.source === ResearchSource.MANUAL) {
      throw new ValidationError(
        "Cannot refine manually created project. Use updateContext instead."
      );
    }

    // Merge refinements with existing data using factory
    const updateData = projectFactory.mergeRefinements(
      existingProject,
      refinements
    );

    // Add refinement notes if provided
    if (refinements.refinement_notes) {
      updateData.research_metadata = {
        ...existingProject.research_metadata,
        ...updateData.research_metadata,
        research_notes: `${
          existingProject.research_metadata.research_notes || ""
        }\n\nUser Refinements: ${refinements.refinement_notes}`.trim(),
      } as any;
    }

    if (refinedBy) {
      updateData.updated_by = refinedBy;
    }

    // Update project
    const updatedProject = await this.repository.updateById(
      projectId,
      updateData
    );

    if (!updatedProject) {
      throw new NotFoundError(
        `Project not found after refinement with ID: ${projectId}`
      );
    }

    log.info("Project context refined", { projectId });

    return this.mapEntityToResponse(updatedProject);
  }

  /**
   * Find projects by user
   */
  async findProjectsByUser(userId: string): Promise<ProjectResponse[]> {
    log.debug("Finding projects by user", { userId });

    const [projects] = await this.repository.find({
      user_id: userId,
    });

    return projects.map((p) => this.mapEntityToResponse(p));
  }

  /**
   * Find projects by organization
   */
  async findProjectsByOrganization(
    organizationId: string
  ): Promise<ProjectResponse[]> {
    log.debug("Finding projects by organization", { organizationId });

    const [projects] = await this.repository.find({
      organization_id: organizationId,
    });

    return projects.map((p) => this.mapEntityToResponse(p));
  }

  /**
   * ========================================================================
   * Business Logic Methods (Domain logic as service methods)
   * ========================================================================
   */

  /**
   * Check if project has been AI-researched
   * @param project - The project entity to check
   * @returns True if project was researched by AI (fully or partially)
   */
  isAIResearched(project: IProject): boolean {
    return (
      project.research_metadata?.source === ResearchSource.AI ||
      project.research_metadata?.source === ResearchSource.MIXED
    );
  }

  /**
   * Get research quality score based on confidence level
   * @param project - The project entity to evaluate
   * @returns Quality rating: 'high' (≥0.8), 'medium' (≥0.5), or 'low' (<0.5)
   */
  getResearchQuality(project: IProject): "high" | "medium" | "low" {
    const confidence = project.research_metadata?.confidence || 0;
    if (confidence >= 0.8) return "high";
    if (confidence >= 0.5) return "medium";
    return "low";
  }

  /**
   * Calculate project age in days since creation
   * @param project - The project entity
   * @returns Age in days (integer)
   */
  getProjectAge(project: IProject): number {
    return Math.floor(
      (Date.now() - new Date(project.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }
}

/**
 * Export singleton instance
 */
export const projectsService = new ProjectsService();
