/**
 * Clients Module - Mongoose Schema
 *
 * ============================================
 * INFRASTRUCTURE LAYER - Database Implementation
 * ============================================
 *
 * This file contains ONLY Mongoose-specific schema and document definitions.
 * Uses automatic schema generation from Zod via zodToMongoose().
 *
 * ⚡ TYPE-SAFE SCHEMA GENERATION:
 * - Schema automatically generated from ClientFieldsSchema (Zod)
 * - Zero duplication: Zod schema is single source of truth
 * - Compile-time validation: TypeScript ensures Mongoose matches domain types
 * - Runtime validation: Zod validates at API boundaries
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: mongoose, Mongoose types, @/shared/db/base.schema.types
 * ✅ CAN import: Domain schema definition (for zodToMongoose conversion)
 * ✅ CAN import: Domain enums from ../domain/types (for validation)
 * ✅ CAN be imported by: Repository layer only (when we create one)
 * ⚠️  CAN export: CLIENT_MODEL_NAME constant (safe - just a string)
 * ⚠️  CAN export: ClientDocument type (Mongoose-specific - for repository only)
 * ❌ CANNOT be imported by: Services, factories, API routes
 * ❌ CANNOT export: IClient (use ../domain/types for that)
 *
 * WHO CAN IMPORT THIS:
 * ✅ Repository implementations (to access Mongoose model)
 * ✅ Application layer - ONLY the CLIENT_MODEL_NAME constant!
 * ❌ domain/ - Domain layer has zero infrastructure dependencies
 * ❌ api/ - API layer should not know about database
 *
 * Repository layer will handle conversion between IClient ↔ ClientDocument.
 */

import mongoose, { Schema, Model, InferSchemaType } from "mongoose";
import { modelRegistry } from "@/shared/db/model.registry";
import {
  baseUserEntityDefinition,
  IMongooseDocument,
} from "@/shared/db/base.schema.types";
import { mergeWithBaseFields } from "@/shared/db/schema.builder";
import { ClientFieldsSchema } from "../domain/schema.definition";

// ============================================
// MODEL NAME CONSTANT - Safe to export everywhere
// ============================================

/**
 * Model name constant - used by repository factory
 * This is safe to export and use in application layer as it's just a string
 */
export const CLIENT_MODEL_NAME = "Client";

// ============================================
// MONGOOSE SCHEMA GENERATION - AUTOMATIC FROM ZOD
// ============================================

/**
 * Client Schema Definition - AUTO-GENERATED from Zod
 *
 * ⚡ ZERO DUPLICATION MAGIC:
 * - Schema automatically generated from ClientFieldsSchema (Zod)
 * - Validation rules automatically converted (min, max, enum, etc.)
 * - Type safety guaranteed at compile time
 * - ~200 lines of manual schema definition eliminated!
 *
 * BEFORE (manual definition):
 * ```
 * const clientDefinition = {
 *   company: { name: { type: String, required: true, ... }, ... },
 *   product: { ... },
 *   // 200+ more lines...
 * };
 * ```
 *
 * AFTER (automatic generation):
 * ```
 * const clientDefinition = mergeWithBaseFields(ClientFieldsSchema, baseUserEntityDefinition);
 * ```
 *
 * The mergeWithBaseFields function:
 * 1. Converts ClientFieldsSchema (Zod) to Mongoose schema definition
 * 2. Merges with baseUserEntityDefinition (audit fields, soft delete, etc.)
 * 3. Returns complete schema definition ready for new Schema()
 *
 * Field Naming Convention:
 * - Uses snake_case for consistency with MongoDB collections
 * - Nested objects use snake_case for field names
 * - This matches the base entity fields (user_id, created_at, etc.)
 */
const clientDefinition = mergeWithBaseFields(
  ClientFieldsSchema,
  baseUserEntityDefinition
);

/**
 * Create the Mongoose Schema from the auto-generated definition
 */
const ClientSchema = new Schema(clientDefinition, {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  collection: "clients",
  versionKey: false,
});

// ============================================
// INDEXES - Performance Optimization
// ============================================

/**
 * Add compound indexes for common queries
 */
ClientSchema.index({ user_id: 1, is_deleted: 1 });
ClientSchema.index({ organization_id: 1, is_deleted: 1 });
ClientSchema.index({ "company.website": 1 });
ClientSchema.index({ "research_metadata.status": 1 });
ClientSchema.index({ created_at: -1 });

// ============================================
// TYPE INFERENCE - Mongoose Document Type
// ============================================

/**
 * ClientDocument - Mongoose-specific document type
 *
 * This type is inferred from the Mongoose schema and includes:
 * - All schema fields
 * - Mongoose Document methods (_id, save, etc.)
 * - MongoDB ObjectId for _id
 * - Timestamps (created_at, updated_at)
 *
 * IMPORTANT: This type should ONLY be used in:
 * - Repository implementations
 * - Database migration scripts
 * - Infrastructure layer code
 *
 * Services and business logic should use IClient from ../domain/types instead!
 */
export type ClientDocument = IMongooseDocument<
  InferSchemaType<typeof ClientSchema>
>;

// ============================================
// MODEL CREATION & REGISTRATION
// ============================================

/**
 * Create or retrieve the Client Mongoose model
 *
 * Handles hot module replacement in development:
 * - Uses existing model if already registered
 * - Creates new model if not registered
 */
const ClientModel =
  (mongoose.models[CLIENT_MODEL_NAME] as Model<ClientDocument>) ||
  mongoose.model<ClientDocument>(CLIENT_MODEL_NAME, ClientSchema);

/**
 * Register the model with the central registry
 * This allows the repository factory to find the model by name
 */
modelRegistry.register<ClientDocument>(CLIENT_MODEL_NAME, ClientModel);

/**
 * Export the Mongoose model
 * ONLY use this in repository implementations!
 */
export default ClientModel;
