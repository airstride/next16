/**
 * Projects Module - Mongoose Schema
 *
 * ============================================
 * INFRASTRUCTURE LAYER - Database Implementation
 * ============================================
 *
 * This file contains ONLY Mongoose-specific schema and document definitions.
 * This is the ONLY file in the projects module that should know about Mongoose.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: mongoose, Mongoose types, @/shared/db/base.schema.types
 * ✅ CAN import: Domain enums from ../domain/types (for validation)
 * ✅ CAN be imported by: Repository layer only (when we create one)
 * ⚠️  CAN export: PROJECT_MODEL_NAME constant (safe - just a string)
 * ⚠️  CAN export: ProjectDocument type (Mongoose-specific - for repository only)
 * ❌ CANNOT be imported by: Services, factories, API routes
 * ❌ CANNOT export: IProject (use ../domain/types for that)
 *
 * WHO CAN IMPORT THIS:
 * ✅ Repository implementations (to access Mongoose model)
 * ✅ Application layer - ONLY the PROJECT_MODEL_NAME constant!
 * ❌ domain/ - Domain layer has zero infrastructure dependencies
 * ❌ api/ - API layer should not know about database
 *
 * Repository layer will handle conversion between IProject ↔ ProjectDocument.
 */

import mongoose, { Schema, Model, InferSchemaType } from "mongoose";
import { modelRegistry } from "@/shared/db/model.registry";
import {
  baseUserEntityDefinition,
  IMongooseDocument,
} from "@/shared/db/base.schema.types";
import {
  ResearchStatusValues,
  ResearchSourceValues,
  CompanyStageValues,
} from "../domain/types";

// ============================================
// MODEL NAME CONSTANT - Safe to export everywhere
// ============================================

/**
 * Model name constant - used by repository factory
 * This is safe to export and use in application layer as it's just a string
 */
export const PROJECT_MODEL_NAME = "Project";

// ============================================
// MONGOOSE SCHEMA DEFINITION
// ============================================

/**
 * Project Schema Definition Object
 *
 * Defines the MongoDB schema structure using Mongoose.
 * This matches the IProject domain interface but with Mongoose-specific decorators.
 *
 * Field Naming Convention:
 * - Uses snake_case for consistency with MongoDB collections
 * - Nested objects use snake_case for field names
 * - This matches the base entity fields (user_id, created_at, etc.)
 */
const projectDefinition = {
  // Company information
  company: {
    name: { type: String, required: true, trim: true, index: true },
    industry: { type: String, trim: true },
    stage: {
      type: String,
      enum: CompanyStageValues,
    },
    website: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
  },

  // Product information
  product: {
    description: { type: String, trim: true },
    features: [{ type: String, trim: true }],
    value_proposition: { type: String, trim: true },
  },

  // Ideal Customer Profile (ICP)
  icp: {
    description: { type: String, trim: true },
    pain_points: [{ type: String, trim: true }],
    demographics: { type: String, trim: true },
    target_company_size: { type: String, trim: true },
    target_industries: [{ type: String, trim: true }],
  },

  // Business goals
  business_goals: {
    traffic_target: { type: Number, min: 0 },
    leads_target: { type: Number, min: 0 },
    revenue_target: { type: Number, min: 0 },
    demo_target: { type: Number, min: 0 },
    other: [{ type: String, trim: true }],
  },

  // Brand voice
  brand_voice: {
    tone: { type: String, trim: true },
    style: { type: String, trim: true },
    keywords: [{ type: String, trim: true }],
    guidelines: { type: String, trim: true },
  },

  // Marketing assets
  marketing_assets: {
    linkedin_url: { type: String, trim: true },
    twitter_url: { type: String, trim: true },
    facebook_url: { type: String, trim: true },
    instagram_url: { type: String, trim: true },
    blog_url: { type: String, trim: true },
    youtube_url: { type: String, trim: true },
    other_urls: [{ type: String, trim: true }],
  },

  // Clients
  clients: [
    {
      name: { type: String, trim: true },
      industry: { type: String, trim: true },
      contract_value: { type: Number, min: 0 },
      start_date: { type: Date },
    },
  ],

  // Revenue metrics
  current_mrr: { type: Number, min: 0 },
  current_arr: { type: Number, min: 0 },

  // Research metadata (AI-powered context)
  research_metadata: {
    status: {
      type: String,
      enum: ResearchStatusValues,
      required: true,
      default: "manual",
    },
    source: {
      type: String,
      enum: ResearchSourceValues,
      required: true,
      default: "manual",
    },
    researched_at: { type: Date },
    confidence: { type: Number, min: 0, max: 1 },
    factual_confidence: { type: Number, min: 0, max: 1 },
    inferred_confidence: { type: Number, min: 0, max: 1 },
    research_notes: { type: String, trim: true },
  },

  // Base entity fields (audit fields, soft delete, user ownership)
  // From @/shared/db/base.schema.types
  ...baseUserEntityDefinition,
};

/**
 * Create the Mongoose Schema from the definition
 */
const ProjectSchema = new Schema(projectDefinition, {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  collection: "projects",
  versionKey: false,
});

// ============================================
// INDEXES - Performance Optimization
// ============================================

/**
 * Add compound indexes for common queries
 */
ProjectSchema.index({ user_id: 1, is_deleted: 1 });
ProjectSchema.index({ organization_id: 1, is_deleted: 1 });
ProjectSchema.index({ "company.website": 1 });
ProjectSchema.index({ "research_metadata.status": 1 });
ProjectSchema.index({ created_at: -1 });

// ============================================
// TYPE INFERENCE - Mongoose Document Type
// ============================================

/**
 * ProjectDocument - Mongoose-specific document type
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
 * Services and business logic should use IProject from ../domain/types instead!
 */
export type ProjectDocument = IMongooseDocument<
  InferSchemaType<typeof ProjectSchema>
>;

// ============================================
// MODEL CREATION & REGISTRATION
// ============================================

/**
 * Create or retrieve the Project Mongoose model
 *
 * Handles hot module replacement in development:
 * - Uses existing model if already registered
 * - Creates new model if not registered
 */
const ProjectModel =
  (mongoose.models[PROJECT_MODEL_NAME] as Model<ProjectDocument>) ||
  mongoose.model<ProjectDocument>(PROJECT_MODEL_NAME, ProjectSchema);

/**
 * Register the model with the central registry
 * This allows the repository factory to find the model by name
 */
modelRegistry.register<ProjectDocument>(PROJECT_MODEL_NAME, ProjectModel);

/**
 * Export the Mongoose model
 * ONLY use this in repository implementations!
 */
export default ProjectModel;
