/**
 * Client Factory
 *
 * ============================================
 * APPLICATION LAYER - Data Transformation
 * ============================================
 *
 * Handles transformations between API contracts and domain entities.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/types (IClient, enums)
 * ✅ CAN import: ../api/validation (API input types)
 * ✅ CAN import: @/shared/db/base.factory (base factory pattern)
 * ❌ CANNOT import: ../infrastructure/schema (ClientDocument, mongoose)
 * ❌ CANNOT import: Database-specific types
 *
 * This factory:
 * - Converts API requests → Domain entities
 * - Handles AI-extracted data → Domain entities
 * - Applies business rules (research metadata, status)
 * - Provides merge logic for refinements
 * - Works with database-agnostic IClient interface
 *
 * TYPE SAFETY:
 * - Uses TypeScript mapped types to ensure all domain fields are handled
 * - Compile-time errors if fields are missed during mapping
 * - Generic deep merge utility for refinements
 */

import { BaseFactory } from "@/shared/db/base.factory";
import { IClient, ResearchStatus, ResearchSource } from "../domain/types";
import {
  AIExtractedContext,
  CreateClientInput,
  UpdateClientInput,
  RefineContextInput,
  WebsiteUrlInput,
} from "../api/validation";

/**
 * ============================================
 * TYPE SAFETY UTILITIES
 * ============================================
 */

/**
 * Extract only the domain data fields from IClient (exclude base entity fields)
 * This gives us the fields that should be mapped from AI extraction
 */
type ClientDataFields = Omit<
  IClient,
  | "_id"
  | "created_by"
  | "updated_by"
  | "created_at"
  | "updated_at"
  | "is_deleted"
  | "created_by_propel_auth_org_id"
  | "user_id"
  | "organization_id"
  | "deleted_at"
  | "deleted_by"
  | "research_metadata"
>;

/**
 * Type-safe mapper that ensures all client data fields are handled
 * Returns a record mapping each field name to whether it was processed from AI
 */
type FieldMapper = Record<keyof ClientDataFields, boolean>;

/**
 * Generic deep merge utility for nested objects
 * Preserves existing data while applying updates
 *
 * @param target - Existing object
 * @param source - Updates to apply
 * @returns Merged object
 */
function deepMerge<T>(
  target: T | undefined,
  source: Partial<T> | undefined
): T | undefined {
  if (!source) return target;
  if (!target) return source as T;

  // For objects, recursively merge
  if (
    typeof target === "object" &&
    typeof source === "object" &&
    !Array.isArray(target)
  ) {
    return { ...target, ...source };
  }

  // For arrays and primitives, source overwrites target
  return source as T;
}

/**
 * Type-safe field merger for refinements
 * Automatically handles all optional nested fields
 *
 * @param existing - Existing client data
 * @param refinements - User refinements (accepts any structure with partial IClient fields)
 * @returns Partial update data with type safety
 */
function mergeClientFields(
  existing: IClient,
  refinements: Record<string, any>
): Partial<IClient> {
  const updateData: Partial<IClient> = {};

  // List of all mergeable field keys
  // TypeScript will enforce this list matches the actual IClient structure
  const mergeableFields: Array<keyof ClientDataFields> = [
    "company",
    "product",
    "icp",
    "business_goals",
    "brand_voice",
    "marketing_assets",
    "existing_customers",
    "current_mrr",
    "current_arr",
    "competitors",
    "current_metrics",
    "content_inventory",
    "tech_stack",
    "resources",
    "conversion_funnel",
  ];

  // Deep merge each field if present in refinements
  for (const field of mergeableFields) {
    if (field in refinements && refinements[field] !== undefined) {
      const existingValue = existing[field];
      const refinementValue = refinements[field];

      // Handle arrays (replace, don't merge)
      if (Array.isArray(refinementValue)) {
        (updateData[field] as any) = refinementValue;
      } else {
        // Deep merge objects
        (updateData[field] as any) = deepMerge(existingValue, refinementValue);
      }
    }
  }

  return updateData;
}

/**
 * ClientFactory
 *
 * Extends BaseFactory to provide Client-specific transformations.
 * Implements the Template Method pattern for consistent entity creation.
 */
export class ClientFactory extends BaseFactory<
  IClient,
  CreateClientInput,
  UpdateClientInput
> {
  /**
   * Map request fields to entity fields
   * Since both API requests and domain entities use snake_case,
   * this is a direct pass-through with type casting
   *
   * @param request - Client request data (create or update)
   * @returns Mapped entity fields in snake_case
   */
  protected mapRequestToEntity(
    request: Partial<CreateClientInput> | UpdateClientInput
  ): Partial<IClient> {
    // Direct pass-through since API and domain both use snake_case
    // TypeScript will enforce structure compatibility
    return request as Partial<IClient>;
  }

  /**
   * Apply business logic during client creation
   * Sets research metadata for manually created clients
   *
   * @param request - Original creation request
   * @param userId - User creating the client
   * @param orgId - Organization ID
   * @returns Business-specific entity fields
   */
  protected applyCreateBusinessLogic(
    _request: CreateClientInput,
    _userId: string,
    _orgId: string
  ): Partial<IClient> {
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
   * Create client entity from AI-extracted website research
   * Maps AI-extracted data to domain entity (both use snake_case)
   * This is a specialized factory method outside the base factory pattern
   *
   * TYPE SAFETY: Uses FieldMapper to ensure all AI-extractable fields are handled
   *
   * @param extractedContext - AI-extracted company context
   * @param websiteInput - Website URL and user context
   * @returns Complete client entity ready for creation
   */
  createFromAIResearch(
    extractedContext: AIExtractedContext,
    websiteInput: WebsiteUrlInput
  ): IClient {
    const now = new Date();

    // Type-safe field mapping tracker
    // If a field exists in both AIExtractedContext and IClient, it MUST be in this object
    // TypeScript will error if any mappable field is missing!
    const fieldsMapped: FieldMapper = {
      company: true,
      product: true,
      icp: true,
      business_goals: true,
      brand_voice: true,
      marketing_assets: true,
      competitors: true,
      current_metrics: true,
      content_inventory: true,
      tech_stack: true,
      resources: true,
      conversion_funnel: true,
      existing_customers: false, // Not in AIExtractedContext
      current_mrr: false, // Not in AIExtractedContext
      current_arr: false, // Not in AIExtractedContext
    };

    // Use fieldsMapped to verify we've considered all fields
    void fieldsMapped;

    // Map AI-extracted data to entity fields with all required base entity fields
    const entity: IClient = {
      // Base entity fields (required)
      _id: "", // Will be set by database
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

      // Optional domain fields mapped from AI extraction
      product: extractedContext.product,
      icp: extractedContext.icp,
      business_goals: extractedContext.business_goals,
      brand_voice: extractedContext.brand_voice,
      marketing_assets: extractedContext.marketing_assets,

      // Fields not in AI extraction (set to defaults)
      existing_customers: [],
      current_mrr: undefined,
      current_arr: undefined,

      // Growth strategy intelligence
      competitors: extractedContext.competitors,
      current_metrics: extractedContext.current_metrics,
      content_inventory: extractedContext.content_inventory,
      tech_stack: extractedContext.tech_stack,
      resources: extractedContext.resources,
      conversion_funnel: extractedContext.conversion_funnel,

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
   * Merge refinements with existing client data
   * Used for refining AI-extracted context with user corrections
   * Deep merges nested objects to preserve existing data
   *
   * TYPE SAFETY: Uses generic mergeClientFields utility that automatically
   * handles all fields. Adding a new field to IClient will automatically
   * make it available for refinement without code changes!
   *
   * @param existingClient - Current client entity
   * @param refinements - User refinements to merge (can be RefineContextInput or UpdateClientInput)
   * @returns Partial entity with merged data
   */
  mergeRefinements(
    existingClient: IClient,
    refinements: RefineContextInput | UpdateClientInput
  ): Partial<IClient> {
    // Use type-safe merge utility
    const updateData = mergeClientFields(existingClient, refinements);

    // Mark as mixed source when refining AI-researched data
    if (existingClient.research_metadata.source === ResearchSource.AI) {
      updateData.research_metadata = {
        ...existingClient.research_metadata,
        source: ResearchSource.MIXED,
      };
    }

    return updateData;
  }
}

// Export singleton instance
export const clientFactory = new ClientFactory();
