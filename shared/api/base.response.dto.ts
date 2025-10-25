/**
 * Base Response DTO
 *
 * ============================================
 * GENERIC BASE CLASS FOR RESPONSE TRANSFORMATION
 * ============================================
 *
 * Handles the common pattern of converting domain entities to API responses:
 * - Transforms _id (MongoDB ObjectId) → id (string)
 * - Provides extension points for custom transformations
 * - Eliminates boilerplate in module-specific DTOs
 *
 * USAGE:
 * 1. Extend this class in your module
 * 2. Override transform() only if you need custom logic
 * 3. Use fromEntity() / fromEntities() for standard conversions
 *
 * PRINCIPLES:
 * - DRY: Define transformation logic once
 * - OOP: Use inheritance for customization
 * - Type-safe: Full TypeScript generics support
 */

import { IEntity, DatabaseId } from "../types/repository.types";

/**
 * Response shape with string ID instead of DatabaseId
 */
export type ResponseWithId<T> = Omit<T, "_id"> & { id: string };

/**
 * Base Response DTO - Generic class for entity → response conversion
 *
 * @template TEntity - Domain entity type (extends IEntity)
 * @template TResponse - API response type
 */
export abstract class BaseResponseDTO<
  TEntity extends IEntity<DatabaseId>,
  TResponse extends { id: string }
> {
  /**
   * Transform a single entity to response shape
   *
   * MUST BE OVERRIDDEN by subclasses to define transformation logic.
   * This ensures database-agnostic design - you choose how to handle IDs.
   *
   * Common patterns:
   * - MongoDB: const { _id, ...rest } = entity; return { ...rest, id: this.convertId(_id) }
   * - SQL: const { id, ...rest } = entity; return { ...rest, id: this.convertId(id) }
   * - Custom: Add computed fields, hide sensitive data, etc.
   *
   * @param entity - Domain entity
   * @returns API response object
   */
  protected abstract transform(entity: TEntity): TResponse;

  /**
   * Convert database ID to string
   * Handles MongoDB ObjectId, PostgreSQL integers/UUIDs, etc.
   *
   * Override if you need custom ID serialization
   *
   * @param id - Database identifier
   * @returns String representation
   */
  protected convertId(id: DatabaseId): string {
    if (typeof id === "string") return id;
    if (typeof id === "number") return id.toString();
    if (id && typeof id === "object" && "toString" in id) {
      return id.toString();
    }
    return String(id);
  }

  /**
   * Helper: Default MongoDB transformation (_id → id)
   * Use this in your transform() method for MongoDB-based entities
   *
   * @param entity - Entity with _id field
   * @returns Object with id instead of _id
   */
  protected transformMongoEntity(
    entity: TEntity
  ): Omit<TEntity, "_id"> & { id: string } {
    const { _id, ...rest } = entity;
    return {
      ...rest,
      id: this.convertId(_id),
    };
  }

  /**
   * Helper: Default SQL transformation (id remains as id)
   * Use this in your transform() method for SQL-based entities
   *
   * @param entity - Entity with id field (SQL databases)
   * @returns Object with id as string
   */
  protected transformSqlEntity(entity: any): {
    id: string;
    [key: string]: any;
  } {
    const { _id, ...rest } = entity;
    return {
      ...rest,
      id: this.convertId(_id), // SQL entities still use _id from IEntity interface
    };
  }

  /**
   * Public API: Convert single entity to response
   *
   * @param entity - Domain entity
   * @returns API response object
   */
  public fromEntity(entity: TEntity): TResponse {
    return this.transform(entity);
  }

  /**
   * Public API: Convert multiple entities to responses
   *
   * @param entities - Array of domain entities
   * @returns Array of API response objects
   */
  public fromEntities(entities: TEntity[]): TResponse[] {
    return entities.map((entity) => this.transform(entity));
  }

  /**
   * Alias for fromEntity (for backwards compatibility)
   */
  public toResponse(entity: TEntity): TResponse {
    return this.fromEntity(entity);
  }

  /**
   * Alias for fromEntities (for backwards compatibility)
   */
  public toResponses(entities: TEntity[]): TResponse[] {
    return this.fromEntities(entities);
  }
}
