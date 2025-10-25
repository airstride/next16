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
 * Competitor intelligence
 */
export interface ICompetitor {
  name: string;
  website?: string;
  positioning?: string;
  strengths?: string[];
  weaknesses?: string[];
  estimated_monthly_traffic?: number;
}

/**
 * Traffic source breakdown
 */
export interface ITrafficSource {
  source: string; // e.g., "Organic Search", "Direct", "Referral", "Social"
  percentage?: number;
}

/**
 * Current performance metrics
 */
export interface ICurrentMetrics {
  monthly_traffic?: number;
  monthly_leads?: number;
  conversion_rate?: number;
  cac?: number; // Customer acquisition cost
  ltv?: number; // Lifetime value
  top_pages?: string[]; // URLs of best performing content
  top_keywords?: string[]; // SEO keywords ranking for
  traffic_sources?: ITrafficSource[];
  bounce_rate?: number;
  avg_session_duration?: number; // seconds
}

/**
 * Content inventory snapshot
 */
export interface IContentInventory {
  total_blog_posts?: number;
  total_case_studies?: number;
  total_whitepapers?: number;
  total_videos?: number;
  total_podcasts?: number;
  top_performing_content?: string[]; // URLs
  publishing_frequency?: string; // e.g., "2x/week", "monthly"
  last_published?: Date;
  content_themes?: string[]; // Main topics covered
}

/**
 * Marketing technology stack
 */
export interface ITechStack {
  cms?: string; // e.g., "Webflow", "WordPress", "Custom"
  analytics?: string[]; // e.g., ["Google Analytics 4", "Plausible"]
  email_platform?: string; // e.g., "Mailchimp", "SendGrid"
  crm?: string; // e.g., "HubSpot", "Salesforce"
  social_scheduling?: string; // e.g., "Buffer", "Hootsuite"
  marketing_automation?: string; // e.g., "Marketo", "Pardot"
  seo_tools?: string[]; // e.g., ["Ahrefs", "SEMrush"]
  other_tools?: string[];
}

/**
 * Team and resource capacity
 */
export interface IResources {
  total_team_size?: number;
  marketing_team_size?: number;
  content_writers?: number;
  has_in_house_design?: boolean;
  has_in_house_dev?: boolean;
  monthly_marketing_budget?: number;
  paid_ad_budget?: number;
  content_budget?: number;
}

/**
 * Conversion funnel stages
 */
export interface IConversionFunnel {
  awareness_channels?: string[]; // e.g., ["SEO", "Paid Ads", "Social Media"]
  consideration_assets?: string[]; // e.g., ["Case Studies", "Product Demo", "Free Trial"]
  decision_triggers?: string[]; // e.g., ["Pricing Page Visit", "Demo Booking", "Contact Sales"]
  primary_cta?: string; // Main call-to-action (e.g., "Book a Demo", "Start Free Trial")
  conversion_bottleneck?: string; // Biggest drop-off point
  avg_sales_cycle_days?: number;
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

  // Growth strategy intelligence (NEW)
  competitors?: ICompetitor[];
  current_metrics?: ICurrentMetrics;
  content_inventory?: IContentInventory;
  tech_stack?: ITechStack;
  resources?: IResources;
  conversion_funnel?: IConversionFunnel;

  research_metadata: IResearchMetadata;

  // Additional audit fields from base (already in IEntity but explicit for clarity)
  deleted_at?: Date;
  deleted_by?: string;
}
