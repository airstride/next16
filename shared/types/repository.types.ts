/**
 * Repository Types
 *
 * Database-agnostic types for the repository layer.
 * These types do NOT import or depend on any specific database library.
 * This allows switching between MongoDB, SQL, or any other database.
 */

/**
 * DatabaseId - Generic identifier type
 * Can be MongoDB ObjectId, SQL integer, UUID, or string
 * This is intentionally flexible to support any database
 */
export type DatabaseId = string | number | object;

/**
 * IEntity
 *
 * Base interface for all database entities.
 * Includes standard audit fields and soft-delete support.
 *
 * This interface is COMPLETELY database-agnostic - it works with:
 * - MongoDB (ObjectId)
 * - PostgreSQL/MySQL (integer or UUID)
 * - Any other database
 *
 * @template TId - The type of the entity's identifier
 *
 * @property _id - Unique identifier (flexible type for any DB)
 * @property created_by - ID of the user who created this entity
 * @property updated_by - ID of the user who last updated this entity
 * @property created_at - Timestamp when the entity was created
 * @property updated_at - Timestamp when the entity was last updated
 * @property is_deleted - Soft-delete flag
 * @property created_by_propel_auth_org_id - Organization ID from PropelAuth
 */
export interface IEntity<TId = DatabaseId> {
  _id: TId;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
  is_deleted?: boolean;
  created_by_propel_auth_org_id?: string;
}

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
}

/**
 * Sort options abstracted from Mongoose
 */
export type SortOptions = Record<string, 1 | -1 | "asc" | "desc">;

/**
 * Filter type that abstracts away Mongoose FilterQuery
 * This allows services to define filters without depending on Mongoose
 */
export type EntityFilter<T = Record<string, unknown>> = {
  [K in keyof T]?: T[K] extends Date
    ?
        | T[K]
        | {
            $in?: T[K][];
            $nin?: T[K][];
            $gt?: T[K];
            $lt?: T[K];
            $gte?: T[K];
            $lte?: T[K];
          }
    : T[K] extends string | number | boolean
    ?
        | T[K]
        | {
            $in?: T[K][];
            $nin?: T[K][];
            $gt?: T[K];
            $lt?: T[K];
            $gte?: T[K];
            $lte?: T[K];
          }
    : T[K] extends Array<infer U>
    ? U | { $in?: U[]; $nin?: U[] }
    : T[K] | { $in?: T[K][]; $nin?: T[K][] };
} & {
  [key: string]: unknown; // Allow additional fields not strictly typed
  $or?: EntityFilter<T>[];
  $and?: EntityFilter<T>[];
};

/**
 * Query options for repositories that don't expose Mongoose details
 */
export interface QueryOptions {
  sort?: SortOptions;
  skip?: number;
  limit?: number;
}

/**
 * Interface for bulk write operation results
 */
export interface BulkWriteResult<TEntity = unknown> {
  counts: {
    /** Number of documents that were matched for update operations */
    matchedCount: number;
    modifiedCount: number;
    upsertedCount: number;
    deletedCount: number;
    insertedCount: number;
  };
  /** The actual entities that were affected by the operation */
  entities: TEntity[];
}
