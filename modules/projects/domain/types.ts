/**
 * Projects Module - Domain Types
 *
 * ============================================
 * DOMAIN LAYER - Pure Business Logic
 * ============================================
 *
 * This file contains ONLY domain types and interfaces that are completely
 * independent of any infrastructure (database, API, external services).
 *
 * ARCHITECTURAL BOUNDARIES:
 * ✅ CAN import: @/shared/types/repository.types (IEntity, DatabaseId)
 * ✅ CAN import: Pure TypeScript types, enums, interfaces
 * ❌ CANNOT import: mongoose, Database-specific types
 * ❌ CANNOT import: ../infrastructure/* (schema, repository)
 * ❌ CANNOT import: ../api/* (validation, DTOs)
 * ❌ CANNOT import: ../application/* (services, factories)
 *
 * WHO CAN IMPORT THIS:
 * ✅ application/ - Service layer needs domain types
 * ✅ infrastructure/ - Database layer implements domain types
 * ✅ api/ - API layer transforms to/from domain types
 * ✅ External modules - Domain types are public contracts
 *
 * This follows Clean Architecture / Hexagonal Architecture principles:
 * Domain is the center, everything else depends on it, not vice versa.
 */

import { IEntity, DatabaseId } from "@/shared/types/repository.types";

// ============================================
// ENUMS - Business Domain Enums
// ============================================

/**
 * Research status for AI-powered context ingestion
 */
export enum ResearchStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  MANUAL = "manual",
}

export const ResearchStatusValues = Object.values(ResearchStatus);

/**
 * Research source tracking
 */
export enum ResearchSource {
  AI = "ai",
  MANUAL = "manual",
  MIXED = "mixed",
}

export const ResearchSourceValues = Object.values(ResearchSource);

/**
 * Company stage enum
 */
export enum CompanyStage {
  PRE_SEED = "pre-seed",
  SEED = "seed",
  SERIES_A = "series-a",
  SERIES_B = "series-b",
  SERIES_C_PLUS = "series-c-plus",
  GROWTH = "growth",
  PUBLIC = "public",
}

export const CompanyStageValues = Object.values(CompanyStage);

// ============================================
// DOMAIN INTERFACES - Database Agnostic
// ============================================

/**
 * Company information
 */
export interface ICompany {
  name: string;
  industry?: string;
  stage?: CompanyStage;
  website: string;
  description?: string;
}

/**
 * Product information
 */
export interface IProduct {
  description?: string;
  features?: string[];
  value_proposition?: string;
}

/**
 * Ideal Customer Profile (ICP)
 */
export interface IICP {
  description?: string;
  pain_points?: string[];
  demographics?: string;
  target_company_size?: string;
  target_industries?: string[];
}

/**
 * Business goals and targets
 */
export interface IBusinessGoals {
  traffic_target?: number;
  leads_target?: number;
  revenue_target?: number;
  demo_target?: number;
  other?: string[];
}

/**
 * Brand voice and messaging guidelines
 */
export interface IBrandVoice {
  tone?: string;
  style?: string;
  keywords?: string[];
  guidelines?: string;
}

/**
 * Marketing assets and social media URLs
 */
export interface IMarketingAssets {
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  blog_url?: string;
  youtube_url?: string;
  other_urls?: string[];
}

/**
 * Client information
 */
export interface IClient {
  name?: string;
  industry?: string;
  contract_value?: number;
  start_date?: Date;
}

/**
 * Research metadata for AI-powered extraction
 */
export interface IResearchMetadata {
  status: ResearchStatus;
  source: ResearchSource;
  researched_at?: Date;
  confidence?: number;
  factual_confidence?: number;
  inferred_confidence?: number;
  research_notes?: string;
}

// ============================================
// ROOT DOMAIN ENTITY
// ============================================

/**
 * IProject - Database-Agnostic Project Entity
 *
 * This interface mirrors the Mongoose schema structure (single source of truth).
 *
 * - Extends IEntity<DatabaseId> for base entity fields
 * - Uses snake_case consistently across all layers (domain, API, database)
 * - Completely independent of database implementation details
 * - Type structure inferred from Mongoose schema definition
 * - Services work with THIS interface
 * - Database layer implements THIS interface
 *
 * @extends IEntity<DatabaseId> - Inherits: _id, created_by, updated_by, created_at, updated_at, is_deleted
 */
export interface IProject extends IEntity<DatabaseId> {
  // User Ownership (PropelAuth fields - snake_case to match base entity)
  user_id: string;
  organization_id?: string;

  // Domain-specific fields (snake_case to match database schema)
  company: ICompany;
  product?: IProduct;
  icp?: IICP;
  business_goals?: IBusinessGoals;
  brand_voice?: IBrandVoice;
  marketing_assets?: IMarketingAssets;
  clients?: IClient[];
  current_mrr?: number;
  current_arr?: number;
  research_metadata: IResearchMetadata;

  // Additional audit fields from base (already in IEntity but explicit for clarity)
  deleted_at?: Date;
  deleted_by?: string;
}
