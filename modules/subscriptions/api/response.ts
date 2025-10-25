/**
 * Subscription Response DTO
 *
 * ============================================
 * API LAYER - Response Data Transfer Objects
 * ============================================
 *
 * Transforms domain entities to API responses.
 *
 * PATTERN: Extends BaseResponseDTO for automatic transformation
 * - Override transform() to handle metadata Map → Object conversion
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: ../domain/types
 * ✅ CAN import: ./validation
 * ✅ CAN import: @/shared/api (BaseResponseDTO)
 * ❌ CANNOT import: ../infrastructure/schema
 */

import { BaseResponseDTO } from "@/shared/api/base.response.dto";
import { ISubscription } from "../domain/types";
import { SubscriptionResponse } from "./validation";

/**
 * Subscription Response DTO
 * Extends BaseResponseDTO with custom metadata transformation
 */
class SubscriptionResponseDTOClass extends BaseResponseDTO<
  ISubscription,
  SubscriptionResponse
> {
  /**
   * Transform domain entity to API response
   * Uses MongoDB helper + custom Map → Object transformation
   */
  protected transform(entity: ISubscription): SubscriptionResponse {
    // Get base MongoDB transformation (_id → id)
    const baseResponse = this.transformMongoEntity(entity);

    return {
      ...baseResponse,
      // Transform Map to plain object for JSON serialization
      metadata: entity.metadata
        ? Object.fromEntries(entity.metadata)
        : undefined,
    } as SubscriptionResponse;
  }
}

/**
 * Singleton instance for use across the application
 */
export const SubscriptionResponseDTO = new SubscriptionResponseDTOClass();

/**
 * Convenience functions
 */
export const toSubscriptionResponse = (
  entity: ISubscription
): SubscriptionResponse => SubscriptionResponseDTO.fromEntity(entity);

export const toSubscriptionResponses = (
  entities: ISubscription[]
): SubscriptionResponse[] => SubscriptionResponseDTO.fromEntities(entities);
