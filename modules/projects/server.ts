/**
 * Projects Module - Server-Side Exports (DEPRECATED)
 *
 * ⚠️ DEPRECATED: Use `@/modules/projects` instead!
 *
 * This file is kept for backward compatibility during migration.
 * New code should import from the main barrel export:
 *
 * @example
 * ```typescript
 * // ❌ OLD (deprecated)
 * import { projectsService } from "@/modules/projects/server";
 *
 * // ✅ NEW (recommended)
 * import { projectsService } from "@/modules/projects";
 * ```
 */

// Re-export from main barrel export
export { projectsService, PROJECT_MODEL_NAME, type IProject } from "./index";
