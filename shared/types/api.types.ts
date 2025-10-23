/**
 * API Response Types
 *
 * Types specific to API responses and HTTP layer
 * Separated from repository and validation concerns
 */

/**
 * IResponse
 *
 * Base interface for all API responses.
 * Empty interface to allow for different response types (success, error, etc.)
 * Can be extended for global response fields like tracing_id, request_id, etc.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IResponse {}

/**
 * ISuccessResponse
 *
 * Standard success response with an ID
 * Used for single entity responses (create, update, get by ID)
 */
export interface ISuccessResponse extends IResponse {
  id: string;
}

/**
 * IErrorResponse
 *
 * Standard error response structure
 * Used for validation errors and other error scenarios
 */
export interface IErrorResponse extends IResponse {
  message: string;
  details?: Record<string, string[] | string>;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  page_count: number;
}

/**
 * IPaginationResponse
 *
 * Standardized structure for paginated API responses.
 * - data: The array of items for the current page.
 * - meta.total: The total number of items available (across all pages).
 * - meta.page: The current page number (1-based).
 * - meta.page_size: The maximum number of items per page.
 * - meta.page_count: The total number of pages.
 * Inherits from IResponse for extensibility (e.g., tracing_id).
 */
export interface IPaginationResponse<T> extends IResponse {
  data: T[];
  meta: PaginationMeta;
}
