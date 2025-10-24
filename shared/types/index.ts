/**
 * Shared Types Index
 *
 * Central export point for all shared types across the application
 */

// Repository Types
export type {
  IEntity,
  PaginationOptions,
  SortOptions,
  EntityFilter,
  QueryOptions,
  BulkWriteResult,
} from "./repository.types";

// API Types
export type {
  IResponse,
  ISuccessResponse,
  IErrorResponse,
  PaginationMeta,
  IPaginationResponse,
} from "./api.types";

// Validation Types
export type { IZod, BrandedZodType } from "./validation.types";

// Clone Types
export type {
  CloneToCollectionOptions,
  CloneOperationResult,
} from "./clone.types";

// Inngest Types
export type * from "./inngest.types";

// API HOF Types
export type {
  NextRouteContext,
  CoreHandler,
  NextRouteHandler,
} from "./api-hof.types";

// API Client Types
export type { FetchType, ApiError } from "../api/api.client";
export {
  get,
  post,
  put,
  patch,
  del,
  setAccessTokenGetter,
  readDataFromStream,
} from "../api/api.client";

// Error Handling Classes & Utilities
export {
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  ServiceUnavailableError,
  ErrorHandler,
  ErrorResponse,
  isOperationalError,
} from "../utils/errors";

// Response Helpers
export {
  SuccessResponse,
  PaginatedResponse,
  ResponseHeaders,
} from "../api/response.helper";

// Error Handler HOF
export {
  withErrorHandler,
  withErrorHandlerContext,
} from "../api/error.handler.hof";
