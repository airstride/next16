/**
 * Client Response DTO
 *
 * ============================================
 * API LAYER - Response Data Transfer Objects
 * ============================================
 *
 * Handles conversion from domain entities to API responses.
 *
 * PATTERN: Extends BaseResponseDTO for automatic transformation
 * - Default behavior: Spreads all fields, converts _id → id
 * - Override transform() only when you need custom logic
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/types (IClient - domain entity)
 * ✅ CAN import: ./validation (API contract types)
 * ✅ CAN import: @/shared/api (BaseResponseDTO)
 * ❌ CANNOT import: ../infrastructure/schema (ClientDocument, mongoose)
 * ❌ CANNOT import: ../application/* (services, factories)
 */

import { BaseResponseDTO } from "@/shared/api/base.response.dto";
import { IClient } from "../domain/types";
import { ClientResponse } from "./validation";

/**
 * Client Response DTO
 * Uses MongoDB transformation helper from BaseResponseDTO
 *
 * The transformMongoEntity helper:
 * - Spreads all entity fields
 * - Converts _id (MongoDB ObjectId) → id (string)
 * - Maintains type safety
 *
 * When migrating to SQL, change to:
 *   return this.transformSqlEntity(entity) as ClientResponse;
 *
 * Override transform() for custom transformations:
 * - Computed fields
 * - Field hiding for security
 * - Data restructuring
 * - Value formatting
 */
class ClientResponseDTOClass extends BaseResponseDTO<IClient, ClientResponse> {
  /**
   * Transform IClient domain entity to ClientResponse
   * Uses MongoDB helper since we're currently on MongoDB
   */
  protected transform(entity: IClient): ClientResponse {
    // Use MongoDB helper for _id → id transformation
    return this.transformMongoEntity(entity) as ClientResponse;
    
    // For custom transformations, extend the helper result:
    // const base = this.transformMongoEntity(entity);
    // return {
    //   ...base,
    //   // Add computed fields:
    //   full_name: `${entity.company.name} (${entity.company.stage})`,
    //   is_research_complete: entity.research_metadata.status === 'completed',
    // } as ClientResponse;
  }
}

/**
 * Singleton instance for use across the application
 */
export const ClientResponseDTO = new ClientResponseDTOClass();

/**
 * Convenience functions (optional - can use ClientResponseDTO directly)
 */
export const toClientResponse = (entity: IClient): ClientResponse =>
  ClientResponseDTO.fromEntity(entity);

export const toClientResponses = (entities: IClient[]): ClientResponse[] =>
  ClientResponseDTO.fromEntities(entities);
