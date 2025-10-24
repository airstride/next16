import type { Document, Types } from "mongoose";

/**
 * Base audit fields that all entities should have (MongoDB snake_case)
 * These track who created/updated records and when
 */
export interface IAuditFields {
  created_at: Date;
  updated_at: Date;
  created_by?: string; // PropelAuth user ID
  updated_by?: string; // PropelAuth user ID
  created_by_propelauth_org_id?: string; // PropelAuth organization ID
}

/**
 * Soft delete fields for logical deletion (MongoDB snake_case)
 */
export interface ISoftDelete {
  is_deleted: boolean;
  deleted_at?: Date;
  deleted_by?: string;
}

/**
 * Base entity interface that all MongoDB documents should extend
 * Combines audit fields, soft delete, and standard MongoDB Document
 */
export interface IBaseEntity extends Document, IAuditFields, ISoftDelete {
  _id: any; // MongoDB ObjectId
}

/**
 * Generic MongoDB Document type with ObjectId and timestamps
 * Use this utility type to create strongly-typed document interfaces from schemas
 *
 * @example
 * ```typescript
 * export type ProjectDocument = IMongooseDocument<InferSchemaType<typeof ProjectSchema>>;
 * ```
 */
export type IMongooseDocument<T> = T &
  Document<Types.ObjectId> & {
    _id: Types.ObjectId;
    created_at: Date;
    updated_at: Date;
  };

/**
 * User ownership fields (MongoDB snake_case)
 */
export interface IUserOwnership {
  user_id: string; // PropelAuth user ID
  organization_id?: string; // PropelAuth organization ID
}

/**
 * Complete base entity with user ownership
 * Most common base type for domain entities
 */
export interface IBaseUserEntity extends IBaseEntity, IUserOwnership {}

/**
 * Base schema definition for user-owned entities
 * Provides common fields that all schemas should include
 */
export const baseUserEntityDefinition = {
  // User ownership (from IBaseUserEntity - using snake_case for MongoDB)
  user_id: { type: String, required: true, index: true },
  organization_id: { type: String, index: true },

  // Audit fields (from IBaseUserEntity - using snake_case for MongoDB)
  created_by: { type: String },
  updated_by: { type: String },
  created_by_propelauth_org_id: { type: String },

  // Soft delete (from IBaseUserEntity - using snake_case for MongoDB)
  is_deleted: { type: Boolean, default: false, index: true },
  deleted_at: { type: Date },
  deleted_by: { type: String },
} as const;

/**
 * Mongoose schema options for base entities
 * Use this for consistent timestamps and collection naming
 */
export const baseSchemaOptions = {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  // Ensure virtuals are included in JSON/Object output
  toJSON: {
    virtuals: true,
    transform: function (_doc: any, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
  },
};

/**
 * Helper to create schema options with custom collection name
 */
export const createSchemaOptions = (collectionName: string) => ({
  ...baseSchemaOptions,
  collection: collectionName,
});
