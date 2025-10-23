/**
 * API Response Helpers
 *
 * Utility functions for creating consistent API responses
 */

import { NextResponse } from "next/server";
import type { IPaginationResponse, ISuccessResponse } from "@/shared/types";

/**
 * Create a success response
 *
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with JSON data
 *
 * @example
 * ```typescript
 * return successResponse({ user: { id: "123", name: "John" } });
 * return successResponse({ message: "Created" }, 201);
 * ```
 */
export function successResponse<T extends Record<string, any>>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Create a paginated response
 *
 * @param data - Array of items
 * @param meta - Pagination metadata
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with paginated data
 *
 * @example
 * ```typescript
 * return paginatedResponse(
 *   users,
 *   { total: 100, page: 1, page_size: 20, page_count: 5 }
 * );
 * ```
 */
export function paginatedResponse<T>(
  data: T[],
  meta: {
    total: number;
    page: number;
    page_size: number;
    page_count: number;
  },
  status: number = 200
): NextResponse {
  const response: IPaginationResponse<T> = {
    data,
    meta,
  };

  return NextResponse.json(response, { status });
}

/**
 * Create an error response
 *
 * @param message - Error message
 * @param status - HTTP status code
 * @param details - Optional error details
 * @returns NextResponse with error data
 *
 * @example
 * ```typescript
 * return errorResponse("User not found", 404);
 * return errorResponse("Validation failed", 400, { email: ["Invalid email"] });
 * ```
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: Record<string, string[] | string>
): NextResponse {
  const response: any = {
    error: message,
    message,
  };

  if (details) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create a not found response
 *
 * @param resource - Resource type (e.g., "User", "Project")
 * @returns NextResponse with 404 status
 *
 * @example
 * ```typescript
 * return notFoundResponse("User");
 * ```
 */
export function notFoundResponse(resource: string = "Resource"): NextResponse {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Create an unauthorized response
 *
 * @param message - Optional custom message
 * @returns NextResponse with 401 status
 */
export function unauthorizedResponse(
  message: string = "You must be logged in"
): NextResponse {
  return errorResponse(message, 401);
}

/**
 * Create a forbidden response
 *
 * @param message - Optional custom message
 * @returns NextResponse with 403 status
 */
export function forbiddenResponse(
  message: string = "You do not have permission to access this resource"
): NextResponse {
  return errorResponse(message, 403);
}

/**
 * Create a validation error response
 *
 * @param details - Field-level validation errors
 * @param message - Optional custom message
 * @returns NextResponse with 400 status
 */
export function validationErrorResponse(
  details: Record<string, string[] | string>,
  message: string = "Validation failed"
): NextResponse {
  return errorResponse(message, 400, details);
}

/**
 * Create a conflict response
 *
 * @param message - Conflict message
 * @returns NextResponse with 409 status
 */
export function conflictResponse(message: string = "Resource already exists"): NextResponse {
  return errorResponse(message, 409);
}

/**
 * Create a created response
 *
 * @param data - Created resource data
 * @returns NextResponse with 201 status
 */
export function createdResponse<T extends ISuccessResponse>(data: T): NextResponse {
  return successResponse(data, 201);
}

/**
 * Create a no content response
 *
 * @returns NextResponse with 204 status
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

