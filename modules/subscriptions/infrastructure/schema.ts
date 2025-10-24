/**
 * Subscriptions Module - Mongoose Schema
 *
 * ============================================
 * INFRASTRUCTURE LAYER - Database Implementation
 * ============================================
 *
 * Minimal schema for subscription/billing management.
 * Links to PropelAuth organizations via propel_auth_org_id.
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: mongoose, @/shared/db/base.schema.types
 * ✅ CAN import: Domain enums from ../domain/types
 * ⚠️  CAN export: SUBSCRIPTION_MODEL_NAME constant (safe)
 * ❌ CANNOT be imported by: Services, factories, API routes
 */

import mongoose, { Schema, Model, InferSchemaType } from "mongoose";
import { modelRegistry } from "@/shared/db/model.registry";
import {
  baseUserEntityDefinition,
  IMongooseDocument,
} from "@/shared/db/base.schema.types";
import {
  SubscriptionTierValues,
  SubscriptionStatusValues,
  BillingCycleValues,
} from "../domain/types";

// ============================================
// MODEL NAME CONSTANT
// ============================================

export const SUBSCRIPTION_MODEL_NAME = "Subscription";

// ============================================
// MONGOOSE SCHEMA DEFINITION
// ============================================

/**
 * Subscription Schema Definition
 *
 * Stores subscription/billing data for PropelAuth organizations.
 * Uses propel_auth_org_id as foreign key (NOT duplicating org data).
 */
const subscriptionDefinition = {
  // Link to PropelAuth organization (GUID)
  propel_auth_org_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },

  // Subscription tier
  tier: {
    type: String,
    enum: SubscriptionTierValues,
    default: "free",
    required: true,
    index: true,
  },

  // Subscription status
  status: {
    type: String,
    enum: SubscriptionStatusValues,
    default: "trial",
    required: true,
    index: true,
  },

  // Trial management
  trial_started_at: { type: Date },
  trial_ends_at: { type: Date, index: true },

  // Billing cycle
  billing_cycle: {
    type: String,
    enum: BillingCycleValues,
    default: "monthly",
  },
  current_period_start: { type: Date },
  current_period_end: { type: Date },

  // Payment provider integration (Stripe)
  stripe_customer_id: { type: String, index: true, sparse: true },
  stripe_subscription_id: { type: String, sparse: true },

  // Feature limits per tier
  limits: {
    projects: { type: Number },
    users: { type: Number },
    api_calls_per_month: { type: Number },
    storage_gb: { type: Number },
  },

  // Current usage (resets monthly)
  usage: {
    projects_count: { type: Number, default: 0 },
    users_count: { type: Number, default: 0 },
    api_calls_count: { type: Number, default: 0 },
    storage_used_gb: { type: Number, default: 0 },
  },

  // Usage tracking metadata
  usage_reset_at: { type: Date }, // Last time usage was reset
  usage_period_start: { type: Date }, // Current usage period start

  // Metadata (flexible key-value pairs)
  metadata: { type: Map, of: String },

  // Base entity fields
  ...baseUserEntityDefinition,
};

/**
 * Create Mongoose Schema
 */
const SubscriptionSchema = new Schema(subscriptionDefinition, {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  collection: "subscriptions",
  versionKey: false,
});

// ============================================
// INDEXES
// ============================================

SubscriptionSchema.index({ propel_auth_org_id: 1, is_deleted: 1 });
SubscriptionSchema.index({ tier: 1, status: 1 });
SubscriptionSchema.index({ trial_ends_at: 1, status: 1 });
SubscriptionSchema.index({ stripe_customer_id: 1 });

// ============================================
// TYPE INFERENCE
// ============================================

/**
 * SubscriptionDocument - Mongoose-specific document type
 * ONLY use in repository implementations!
 */
export type SubscriptionDocument = IMongooseDocument<
  InferSchemaType<typeof SubscriptionSchema>
>;

// ============================================
// MODEL CREATION & REGISTRATION
// ============================================

const SubscriptionModel =
  (mongoose.models[SUBSCRIPTION_MODEL_NAME] as Model<SubscriptionDocument>) ||
  mongoose.model<SubscriptionDocument>(
    SUBSCRIPTION_MODEL_NAME,
    SubscriptionSchema
  );

modelRegistry.register<SubscriptionDocument>(
  SUBSCRIPTION_MODEL_NAME,
  SubscriptionModel
);

export default SubscriptionModel;
