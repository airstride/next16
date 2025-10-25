/**
 * Database Module Exports
 *
 * Central export point for database-related functionality.
 * Provides repository implementations, interfaces, and utilities.
 */

// Repository Interface (database-agnostic)
export type { IRepository } from "./repository.interface";

// Repository Implementations
export { MongooseRepository } from "./mongoose.repository";

// Repository Factory (for dependency injection)
export { RepositoryFactory, type DatabaseType } from "./repository.factory";

// Database Service
export { DatabaseService } from "./database.service";

// Model Registry
export { modelRegistry } from "./model.registry";

// Base Types & Utilities
export {
  type IBaseEntity,
  type IBaseUserEntity,
  baseSchemaOptions,
  createSchemaOptions,
} from "./base.schema.types";

// Base Factory
export { BaseFactory } from "./base.factory";

// Schema Builder (Zod-to-Mongoose)
export {
  zodToMongoose,
  zodToMongooseField,
  mergeWithBaseFields,
  createSchemaBuilder,
  SchemaBuilder,
  type MongooseSchemaOptions,
} from "./schema.builder";