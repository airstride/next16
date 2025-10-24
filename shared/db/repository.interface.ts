/**
 * IRepository Interface
 *
 * Database-agnostic repository interface that defines the contract
 * for all data access operations. This interface allows switching
 * between different database implementations (MongoDB, SQL, etc.)
 * without changing service layer code.
 *
 * Type Parameters:
 *   TEntity - The entity type (must extend IEntity)
 *   TId - The type of the entity's identifier
 *
 * Design Principle: Interface Segregation & Dependency Inversion
 * - Services depend on this abstraction, not concrete implementations
 * - Easy to swap database implementations
 * - Testable with mock implementations
 */

import {
  BulkWriteResult,
  EntityFilter,
  IEntity,
  QueryOptions,
} from "@/shared/types/repository.types";
import {
  CloneOperationResult,
  CloneToCollectionOptions,
} from "@/shared/types/clone.types";

export interface IRepository<TEntity extends IEntity, TId = any> {
  /**
   * Create a new entity
   * @param entity - The entity data to create
   * @returns Promise resolving to the created entity
   */
  create(entity: Partial<TEntity>): Promise<TEntity>;

  /**
   * Create multiple entities in a single operation
   * @param entities - Array of entity data to create
   * @param options - Operation options
   * @returns Promise resolving to array of created entities
   */
  insertMany(
    entities: Partial<TEntity>[],
    options?: { ordered: boolean }
  ): Promise<TEntity[]>;

  /**
   * Upsert (insert or update) multiple entities
   * @param entities - Array of entity data
   * @param matchField - Field(s) to match on for upsert
   * @param options - Operation options
   * @returns Promise with operation results
   */
  bulkWrite(
    entities: Partial<TEntity>[],
    matchField?: keyof TEntity | (keyof TEntity)[],
    options?: { ordered: boolean }
  ): Promise<BulkWriteResult<TEntity>>;

  /**
   * Upsert a single entity
   * @param entity - The entity data
   * @returns Promise resolving to the upserted entity
   */
  upsert(entity: Partial<TEntity>): Promise<TEntity>;

  /**
   * Atomically update specific fields
   * @param id - Entity ID
   * @param updates - Fields to update
   * @param options - Update options
   * @returns Promise resolving to updated entity or null
   */
  atomicUpdate(
    id: TId,
    updates: Record<string, any>,
    options?: { new?: boolean; runValidators?: boolean }
  ): Promise<TEntity | null>;

  /**
   * Find all entities matching the filter
   * @param filter - Filter criteria
   * @param options - Query options (pagination, sorting)
   * @returns Promise resolving to [entities, total count]
   */
  find(
    filter?: EntityFilter<TEntity>,
    options?: QueryOptions
  ): Promise<[TEntity[], number]>;

  /**
   * Find all soft-deleted entities
   * @param filter - Filter criteria
   * @param options - Query options
   * @returns Promise resolving to [entities, total count]
   */
  findDeleted(
    filter?: EntityFilter<TEntity>,
    options?: QueryOptions
  ): Promise<[TEntity[], number]>;

  /**
   * Find a single entity matching the filter
   * @param filter - Filter criteria
   * @returns Promise resolving to entity or null
   */
  findOne(filter: EntityFilter<TEntity>): Promise<TEntity | null>;

  /**
   * Find an entity by its ID
   * @param id - Entity ID
   * @returns Promise resolving to entity or null
   */
  findById(id: TId): Promise<TEntity | null>;

  /**
   * Find entity by ID with populated references
   * @param id - Entity ID
   * @param populateOptions - Fields to populate (DB-specific)
   * @returns Promise resolving to entity or null
   */
  findByIdWithPopulate(
    id: TId,
    populateOptions: any | any[]
  ): Promise<TEntity | null>;

  /**
   * Find entities with populated references
   * @param filter - Filter criteria
   * @param populateOptions - Fields to populate (DB-specific)
   * @param options - Query options
   * @returns Promise resolving to array of entities
   */
  findWithPopulate(
    filter: EntityFilter<TEntity>,
    populateOptions: any | any[],
    options?: QueryOptions
  ): Promise<TEntity[]>;

  /**
   * Update an entity by ID
   * @param id - Entity ID
   * @param update - Update data
   * @returns Promise resolving to updated entity or null
   */
  updateById(id: TId, update: Partial<TEntity>): Promise<TEntity | null>;

  /**
   * Update entity with array filters (for nested arrays)
   * @param id - Entity ID
   * @param update - Update data
   * @param arrayFilters - Array filter conditions (DB-specific)
   * @returns Promise resolving to updated entity or null
   */
  updateByIdWithArrayFilters(
    id: TId,
    update: Partial<TEntity>,
    arrayFilters?: any[]
  ): Promise<TEntity | null>;

  /**
   * Soft-delete an entity (sets is_deleted flag)
   * @param id - Entity ID
   * @returns Promise resolving to deleted entity or null
   */
  softDelete(id: TId): Promise<TEntity | null>;

  /**
   * Count entities matching the filter
   * @param filter - Filter criteria
   * @returns Promise resolving to count
   */
  count(filter?: EntityFilter<TEntity>): Promise<number>;

  /**
   * Validate if an ID is valid for this database
   * @param id - The ID to validate
   * @returns True if valid
   */
  validateId(id: any): boolean;

  /**
   * Clone entities to another collection/table
   * @param targetCollectionName - Target collection/table name
   * @param options - Cloning options
   * @returns Promise with operation results
   */
  cloneToCollection(
    targetCollectionName: string,
    options?: CloneToCollectionOptions
  ): Promise<CloneOperationResult>;

  /**
   * Execute a database-specific aggregation/query pipeline
   * Note: This is database-specific and may not be supported by all implementations
   * @param pipeline - Aggregation pipeline (format depends on database)
   * @returns Promise resolving to aggregation results
   */
  aggregate?(pipeline: any[]): Promise<any[]>;
}
