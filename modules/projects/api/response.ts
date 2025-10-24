/**
 * Project Response DTO
 *
 * ============================================
 * API LAYER - Response Data Transfer Objects
 * ============================================
 *
 * Handles conversion from domain entities to API responses.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/types (IProject - domain entity)
 * ✅ CAN import: ./validation (API contract types)
 * ❌ CANNOT import: ../infrastructure/schema (ProjectDocument, mongoose)
 * ❌ CANNOT import: ../application/* (services, factories)
 *
 * This follows the DTO pattern to decouple internal data structures
 * from external API contracts.
 */

import { IProject } from "../domain/types";
import { ProjectResponse } from "./validation";

/**
 * Project Response Builder
 * Static factory methods for creating response DTOs from entities
 */
export class ProjectResponseDTO {
  /**
   * Create API response from Project entity
   * Maps domain entity (snake_case) to API response (snake_case)
   *
   * @param entity - The Project domain entity
   * @returns ProjectResponse - snake_case API response object
   */
  static fromProject(entity: IProject): ProjectResponse {
    return {
      id: entity._id.toString(),
      company: {
        name: entity.company.name,
        industry: entity.company.industry,
        stage: entity.company.stage,
        website: entity.company.website,
        description: entity.company.description,
      },
      product: {
        description: entity.product?.description,
        features: entity.product?.features || [],
        value_proposition: entity.product?.value_proposition,
      },
      icp: {
        description: entity.icp?.description,
        pain_points: entity.icp?.pain_points || [],
        demographics: entity.icp?.demographics,
        target_company_size: entity.icp?.target_company_size,
        target_industries: entity.icp?.target_industries || [],
      },
      business_goals: {
        traffic_target: entity.business_goals?.traffic_target,
        leads_target: entity.business_goals?.leads_target,
        revenue_target: entity.business_goals?.revenue_target,
        demo_target: entity.business_goals?.demo_target,
        other: entity.business_goals?.other || [],
      },
      brand_voice: {
        tone: entity.brand_voice?.tone,
        style: entity.brand_voice?.style,
        keywords: entity.brand_voice?.keywords || [],
        guidelines: entity.brand_voice?.guidelines,
      },
      marketing_assets: {
        linkedin_url: entity.marketing_assets?.linkedin_url,
        twitter_url: entity.marketing_assets?.twitter_url,
        facebook_url: entity.marketing_assets?.facebook_url,
        instagram_url: entity.marketing_assets?.instagram_url,
        blog_url: entity.marketing_assets?.blog_url,
        youtube_url: entity.marketing_assets?.youtube_url,
        other_urls: entity.marketing_assets?.other_urls || [],
      },
      clients: entity.clients?.map((c) => ({
        name: c.name,
        industry: c.industry,
        contract_value: c.contract_value,
        start_date: c.start_date,
      })),
      current_mrr: entity.current_mrr,
      current_arr: entity.current_arr,
      research_metadata: {
        status: entity.research_metadata.status,
        source: entity.research_metadata.source,
        researched_at: entity.research_metadata.researched_at,
        confidence: entity.research_metadata.confidence,
        factual_confidence: entity.research_metadata.factual_confidence,
        inferred_confidence: entity.research_metadata.inferred_confidence,
        research_notes: entity.research_metadata.research_notes,
      },
      user_id: entity.user_id,
      organization_id: entity.organization_id,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      created_by: entity.created_by,
      updated_by: entity.updated_by,
    };
  }

  /**
   * Create multiple API responses from Project entities
   * Convenience method for bulk transformations
   *
   * @param entities - Array of Project documents
   * @returns Array of ProjectResponse objects
   */
  static fromProjects(entities: IProject[]): ProjectResponse[] {
    return entities.map((entity) => this.fromProject(entity));
  }
}
