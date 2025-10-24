/**
 * API Utilities Index
 *
 * Central export point for all API utilities and HOFs
 */

// Higher-Order Functions
export { withAuth } from "./hofs/withAuth";
export type { WithAuthProps } from "./hofs/withAuth";

export { withSubscription } from "./hofs/withSubscription";
export { withDb as withDb } from "./hofs/withDb";

export { withValidation, withPatchValidation } from "./hofs/withValidation";
export type { JsonPatchOperation } from "./hofs/withValidation";

// Response Helpers
export {
  successResponse,
  paginatedResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  conflictResponse,
  createdResponse,
  noContentResponse,
  createErrorResponse,
} from "./response.helpers";
