/**
 * Project Factory
 *
 * ============================================
 * APPLICATION LAYER - Data Transformation
 * ============================================
 *
 * Handles transformations between API contracts and domain entities.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/types (IProject, enums)
 * ✅ CAN import: ../api/validation (API input types)
 * ✅ CAN import: @/shared/db/base.factory (base factory pattern)
 * ❌ CANNOT import: ../infrastructure/schema (ProjectDocument, mongoose)
 * ❌ CANNOT import: Database-specific types
 *
 * This factory:
 * - Converts API requests → Domain entities
 * - Handles AI-extracted data → Domain entities
 * - Applies business rules (research metadata, status)
 * - Provides merge logic for refinements
 * - Works with database-agnostic IProject interface
 */

import { BaseFactory } from "@/shared/db/base.factory";
import { IProject, ResearchStatus, ResearchSource } from "../domain/types";
import {
  AIExtractedContext,
  CreateProjectInput,
  UpdateProjectInput,
  RefineContextInput,
  WebsiteUrlInput,
} from "../api/validation";

/**
 * ProjectFactory
 *
 * Extends BaseFactory to provide Project-specific transformations.
 * Implements the Template Method pattern for consistent entity creation.
 */
export class ProjectFactory extends BaseFactory<
  IProject,
  CreateProjectInput,
  UpdateProjectInput
> {
  /**
   * Map request fields to entity fields
   * Since both API requests and domain entities use snake_case,
   * this is a direct pass-through with type casting
   *
   * @param request - Project request data (create or update)
   * @returns Mapped entity fields in snake_case
   */
  protected mapRequestToEntity(
    request: Partial<CreateProjectInput> | UpdateProjectInput
  ): Partial<IProject> {
    // Direct pass-through since API and domain both use snake_case
    // TypeScript will enforce structure compatibility
    return request as Partial<IProject>;
  }

  /**
   * Apply business logic during project creation
   * Sets research metadata for manually created projects
   *
   * @param request - Original creation request
   * @param userId - User creating the project
   * @param orgId - Organization ID
   * @returns Business-specific entity fields
   */
  protected applyCreateBusinessLogic(
    _request: CreateProjectInput,
    _userId: string,
    _orgId: string
  ): Partial<IProject> {
    // Mark parameters as intentionally unused in this implementation
    void _request;
    void _userId;
    void _orgId;
    return {
      research_metadata: {
        status: ResearchStatus.MANUAL,
        source: ResearchSource.MANUAL,
      },
    };
  }

  /**
   * Create project entity from AI-extracted website research
   * Maps AI-extracted data to domain entity (both use snake_case)
   * This is a specialized factory method outside the base factory pattern
   *
   * @param extractedContext - AI-extracted company context
   * @param websiteInput - Website URL and user context
   * @returns Complete project entity ready for creation
   */
  createFromAIResearch(
    extractedContext: AIExtractedContext,
    websiteInput: WebsiteUrlInput
  ): IProject {
    const now = new Date();

    // Map AI-extracted data to entity fields with all required base entity fields
    const entity: IProject = {
      // Base entity fields (required)
      _id: "" as any, // Will be set by database
      created_by: websiteInput.user_id,
      updated_by: websiteInput.user_id,
      created_at: now,
      updated_at: now,
      is_deleted: false,
      created_by_propel_auth_org_id: websiteInput.organization_id,

      // User ownership (required)
      user_id: websiteInput.user_id,
      organization_id: websiteInput.organization_id,

      // Company information (required)
      company: {
        name: extractedContext.company.name,
        industry: extractedContext.company.industry,
        stage: extractedContext.company.stage,
        website: websiteInput.website_url,
        description: extractedContext.company.description,
      },

      // Optional domain fields
      product: extractedContext.product as any,
      icp: extractedContext.icp as any,
      business_goals: extractedContext.business_goals as any,
      brand_voice: extractedContext.brand_voice as any,
      marketing_assets: extractedContext.marketing_assets as any,

      // Research metadata (required)
      research_metadata: {
        status: ResearchStatus.COMPLETED,
        source: ResearchSource.AI,
        researched_at: now,
        confidence: extractedContext.confidence.overall,
        factual_confidence: extractedContext.confidence.factual,
        inferred_confidence: extractedContext.confidence.inferred,
        research_notes: extractedContext.research_notes,
      },
    };

    return entity;
  }

  /**
   * Merge refinements with existing project data
   * Used for refining AI-extracted context with user corrections
   * Deep merges nested objects to preserve existing data
   *
   * @param existingProject - Current project entity
   * @param refinements - User refinements to merge (can be RefineContextInput or UpdateProjectInput)
   * @returns Partial entity with merged data
   */
  mergeRefinements(
    existingProject: IProject,
    refinements: RefineContextInput | UpdateProjectInput
  ): Partial<IProject> {
    const updateData: Partial<IProject> = {};

    // Deep merge for nested objects to preserve existing data
    if (refinements.company) {
      updateData.company = {
        ...existingProject.company,
        ...refinements.company,
      } as any;
    }

    if (refinements.product) {
      updateData.product = {
        ...existingProject.product,
        ...refinements.product,
      } as any;
    }

    if (refinements.icp) {
      updateData.icp = {
        ...existingProject.icp,
        ...refinements.icp,
      } as any;
    }

    if (refinements.business_goals) {
      updateData.business_goals = {
        ...existingProject.business_goals,
        ...refinements.business_goals,
      } as any;
    }

    if (refinements.brand_voice) {
      updateData.brand_voice = {
        ...existingProject.brand_voice,
        ...refinements.brand_voice,
      } as any;
    }

    if (refinements.marketing_assets) {
      updateData.marketing_assets = {
        ...existingProject.marketing_assets,
        ...refinements.marketing_assets,
      } as any;
    }

    // Mark as mixed source when refining AI-researched data
    if (existingProject.research_metadata.source === ResearchSource.AI) {
      updateData.research_metadata = {
        ...existingProject.research_metadata,
        source: ResearchSource.MIXED,
      } as any;
    }

    return updateData;
  }
}

// Export singleton instance
export const projectFactory = new ProjectFactory();
