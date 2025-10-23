/**
 * API Utilities Index
 *
 * Central export point for all API utilities and HOFs
 */

// Higher-Order Functions
export { withAuth, compose } from "./with-auth";
export type { WithAuthProps, PermissionConfig } from "./with-auth";

export { withDB } from "./with-db";

export { withValidation, withPatchValidation } from "./with-validation";
export type { JsonPatchOperation } from "./with-validation";

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
} from "./response.helpers";

