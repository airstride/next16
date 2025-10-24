/**
 * Projects Module - Public API
 *
 * ============================================
 * BARREL EXPORT WITH ARCHITECTURAL BOUNDARIES
 * ============================================
 *
 * This file controls what is exported from the projects module and enforces
 * architectural boundaries by making clear what can be imported by external code.
 *
 * DIRECTORY STRUCTURE:
 * ```
 * projects/
 *   domain/          - Pure business domain (no dependencies)
 *     types.ts       - IProject, domain interfaces, enums
 *
 *   application/     - Business logic (depends on domain only)
 *     service.ts     - ProjectsService
 *     factory.ts     - Data transformation
 *
 *   infrastructure/  - Database implementation (isolated, internal only)
 *     schema.ts      - Mongoose schema (NOT exported!)
 *
 *   api/             - API contracts (validation, DTOs)
 *     validation.ts  - Zod schemas
 *     response.ts    - Response DTOs
 *     query.config.ts - Query parsing
 *
 *   index.ts         - This file (controlled exports)
 * ```
 *
 * ARCHITECTURAL PRINCIPLES:
 * 1. Domain layer has ZERO dependencies (center of architecture)
 * 2. Application layer depends on domain only
 * 3. Infrastructure is NEVER exported (internal implementation detail)
 * 4. API layer defines contracts (inputs/outputs)
 * 5. External code imports through this file only
 */

// ============================================
// DOMAIN LAYER - Core Business Types
// ============================================
// ✅ Safe to import anywhere
// ✅ Database-agnostic
// ✅ No external dependencies

export type {
  // Main domain entity
  IProject,

  // Domain sub-interfaces
  ICompany,
  IProduct,
  IICP,
  IBusinessGoals,
  IBrandVoice,
  IMarketingAssets,
  IClient,
  IResearchMetadata,
} from "./domain/types";

export {
  // Domain enums
  ResearchStatus,
  ResearchSource,
  CompanyStage,

  // Enum value arrays (for Zod validation)
  ResearchStatusValues,
  ResearchSourceValues,
  CompanyStageValues,
} from "./domain/types";

// ============================================
// APPLICATION LAYER - Business Logic
// ============================================
// ✅ Safe for API routes to import
// ✅ Safe for other services to import
// ⚠️  Contains business logic - use carefully

export {
  // Service - Main business logic entry point
  ProjectsService,
  projectsService, // Singleton instance
} from "./application/service";

export {
  // Factory - Data transformation (typically internal, but exported for flexibility)
  ProjectFactory,
  projectFactory, // Singleton instance
} from "./application/factory";

// ============================================
// API LAYER - Request/Response Contracts
// ============================================
// ✅ Safe for API routes to import
// ✅ Defines public API contracts

// Validation schemas and types
export {
  // Input schemas
  WebsiteUrlInputSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  RefineContextSchema,

  // Output schemas
  ProjectResponseSchema,
  AIExtractedContextSchema,

  // TypeScript types inferred from schemas
  type WebsiteUrlInput,
  type CreateProjectInput,
  type UpdateProjectInput,
  type RefineContextInput,
  type ProjectResponse,
  type AIExtractedContext,
} from "./api/validation";

// Response DTOs
export { ProjectResponseDTO } from "./api/response";

// Query configuration
export { projectQueryConfig } from "./api/query.config";

// ============================================
// INFRASTRUCTURE LAYER
// ============================================
// ❌ NOT EXPORTED - Internal implementation detail
// ❌ Services should NOT import from infrastructure
// ⚠️  Only exported: PROJECT_MODEL_NAME constant (needed by service)

export {
  PROJECT_MODEL_NAME, // String constant - safe to export
} from "./infrastructure/schema";

// ❌ DO NOT EXPORT:
// - ProjectDocument (Mongoose-specific type)
// - ProjectModel (Mongoose model)
// - Mongoose schema definition
//
// WHY: Services and external code should work with IProject (domain type),
// not ProjectDocument (database implementation). The repository layer
// handles conversion between these types.

// ============================================
// USAGE GUIDELINES FOR EXTERNAL CODE
// ============================================

/**
 * FOR API ROUTES:
 * ```typescript
 * import {
 *   projectsService,           // Service for business logic
 *   CreateProjectInputSchema,  // Zod validation
 *   ProjectResponse,           // TypeScript types
 * } from "@/modules/projects";
 * ```
 *
 * FOR OTHER SERVICES:
 * ```typescript
 * import {
 *   IProject,              // Domain type
 *   projectsService,       // Service for cross-service calls
 *   ResearchStatus,        // Enums
 * } from "@/modules/projects";
 * ```
 *
 * FOR TESTING:
 * ```typescript
 * import {
 *   IProject,              // Domain type for mocking
 *   ProjectFactory,        // Factory for test data
 *   ProjectsService,       // Service class for mocking
 * } from "@/modules/projects";
 * ```
 *
 * ❌ NEVER DO THIS:
 * ```typescript
 * // BAD: Importing from internal directories
 * import { ProjectDocument } from "@/modules/projects/infrastructure/schema";
 * import { something } from "@/modules/projects/application/service";
 *
 * // GOOD: Import through barrel export
 * import { IProject, projectsService } from "@/modules/projects";
 * ```
 */

// ============================================
// ARCHITECTURAL BENEFITS
// ============================================

/**
 * 1. CLEAR BOUNDARIES
 *    - Physical directories enforce logical boundaries
 *    - Barrel export makes public API obvious
 *    - Easy to see what's internal vs. public
 *
 * 2. DATABASE AGNOSTIC
 *    - Services work with IProject (domain), not ProjectDocument (Mongoose)
 *    - Can swap MongoDB → PostgreSQL by only changing infrastructure/
 *    - Business logic has zero database dependencies
 *
 * 3. TESTABILITY
 *    - Mock IRepository interface
 *    - Test services without database
 *    - Fast unit tests
 *
 * 4. MAINTAINABILITY
 *    - Each layer has single responsibility
 *    - Changes are isolated
 *    - Easy to understand dependencies
 *
 * 5. SCALABILITY
 *    - Can extract microservices easily
 *    - Domain types are portable
 *    - Infrastructure can vary per service
 *
 * 6. TYPE SAFETY
 *    - Compile-time checks
 *    - IDE autocompletion works perfectly
 *    - Refactoring is safe
 */
