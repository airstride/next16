/**
 * API Response Helpers
 *
 * Standardized response utilities for API routes.
 * Ensures consistent response structure across all endpoints.
 */

import {
  ISuccessResponse,
  IPaginationResponse,
  PaginationMeta,
} from "../types/api.types";

/**
 * Success Response Helper
 *
 * Creates a standardized success response with data
 */
export const SuccessResponse = {
  /**
   * Create success response with ID (for create/update operations)
   */
  withId: (id: string, status: number = 200): Response => {
    const response: ISuccessResponse = { id };
    return new Response(JSON.stringify(response), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  },

  /**
   * Create success response with data
   */
  withData: <T>(data: T, status: number = 200): Response => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  },

  /**
   * Create success response with no content
   */
  noContent: (): Response => {
    return new Response(null, {
      status: 204,
    });
  },

  /**
   * Create created response (201)
   */
  created: (id: string): Response => {
    return SuccessResponse.withId(id, 201);
  },

  /**
   * Create accepted response (202) - for async operations
   */
  accepted: (message: string = "Request accepted for processing"): Response => {
    return new Response(JSON.stringify({ message }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  },
};

/**
 * Paginated Response Helper
 *
 * Creates standardized paginated responses
 */
export const PaginatedResponse = {
  /**
   * Create paginated response
   */
  create: <T>(
    data: T[],
    pagination: {
      total: number;
      page: number;
      page_size: number;
    }
  ): Response => {
    const page_count = Math.ceil(pagination.total / pagination.page_size);

    const meta: PaginationMeta = {
      total: pagination.total,
      page: pagination.page,
      page_size: pagination.page_size,
      page_count,
    };

    const response: IPaginationResponse<T> = {
      data,
      meta,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};

/**
 * Response Headers Helper
 *
 * Common response headers
 */
export const ResponseHeaders = {
  /**
   * Create standard JSON headers
   */
  json: (): HeadersInit => ({
    "Content-Type": "application/json",
  }),

  /**
   * Create JSON headers with CORS
   */
  jsonWithCors: (origin: string = "*"): HeadersInit => ({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }),

  /**
   * Create headers with cache control
   */
  withCache: (maxAge: number): HeadersInit => ({
    "Content-Type": "application/json",
    "Cache-Control": `public, max-age=${maxAge}`,
  }),

  /**
   * Create headers with no cache
   */
  noCache: (): HeadersInit => ({
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate",
  }),
};
