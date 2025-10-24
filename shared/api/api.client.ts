/**
 * Client-side API fetch utility
 *
 * This module provides a type-safe wrapper around the native fetch API for making
 * requests to the backend API from React components. It automatically handles:
 * - Bearer token authentication
 * - JSON serialization/deserialization
 * - Error handling with enriched error objects
 * - FormData support
 * - Streaming responses
 *
 * All requests are prefixed with `/v2/` which maps to internal API routes
 * via the Next.js rewrite rule in next.config.mjs
 *
 * @module shared/api/api.client
 */

// ============================================================================
// Types
// ============================================================================

interface FetchType {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown | FormData;
  headers?: Record<string, string>;
  isStream?: boolean;
  cache?: RequestCache;
}

interface ApiError extends Error {
  status: number;
  data: unknown;
  url: string;
  method: string;
}

// ============================================================================
// Authentication Token Management
// ============================================================================

/**
 * Internal reference to the access token getter function.
 * This is set by the authentication layer (e.g., AuthContext) to provide
 * the current user's access token for API requests.
 */
let getAccessToken: (() => string) | null = null;

/**
 * Sets the access token getter function.
 * This should be called once during app initialization by the auth provider.
 *
 * @param fn - Function that returns the current access token
 *
 * @example
 * ```tsx
 * // In AuthContext or app initialization
 * setAccessTokenGetter(() => authState.accessToken);
 * ```
 */
export const setAccessTokenGetter = (fn: () => string): void => {
  getAccessToken = fn;
};

/**
 * Retrieves the bearer token for API requests.
 * @returns Bearer token string or null if not available
 */
const getBearerToken = (): string | null => {
  const token = getAccessToken?.();
  return token ? `Bearer ${token}` : null;
};

// ============================================================================
// Core Fetch Implementation
// ============================================================================

/**
 * Internal fetch wrapper that handles all HTTP requests.
 *
 * @template Type - Expected response type
 * @param config - Fetch configuration
 * @returns Promise resolving to response data or stream
 * @throws {ApiError} When the request fails with status code and error details
 */
async function doFetch<Type>({
  url,
  method,
  body,
  headers = {},
  isStream,
  cache = "default",
}: FetchType): Promise<Type | ReadableStream<Uint8Array> | null> {
  return new Promise(async (resolve, reject) => {
    let response = null;
    const bearerToken = getBearerToken();

    try {
      const isFormData = body instanceof FormData;
      let contentType;

      if (isStream) {
        contentType = "application/octet-stream";
      } else if (!isFormData) {
        contentType = "application/json";
      }

      response = await fetch(`/v2/${url}`, {
        method,
        cache,
        headers: {
          ...(contentType ? { "Content-Type": contentType } : {}),
          ...(bearerToken ? { Authorization: bearerToken } : {}),
          ...headers,
        },
        ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
      });

      // Handle streaming responses
      if (isStream) {
        if (!response.status.toString().startsWith("20")) {
          reject(response.statusText);
        } else {
          resolve(response.body);
        }
        return;
      }

      // Parse JSON response (except for DELETE requests)
      let json;
      if (method !== "DELETE") {
        try {
          json = await response.json();
        } catch (error) {
          if (error instanceof SyntaxError) {
            console.error("There was a SyntaxError", error);
          } else {
            console.error("There was an error", error);
          }
        }
      }

      // Handle error responses
      if (!response.status.toString().startsWith("20")) {
        const message =
          json?.details?.message ??
          json?.message ??
          response.statusText ??
          "Something went wrong";
        const err = Object.assign(new Error(message), {
          status: response.status,
          data: json,
          url: `/v2/${url}`,
          method,
        }) as ApiError;
        reject(err);
      } else {
        resolve(json);
      }
    } catch (error) {
      console.error("There was an error", error);
      reject(error);
    }
  });
}

// ============================================================================
// HTTP Method Helpers
// ============================================================================

/**
 * Performs a GET request.
 *
 * @template Type - Expected response type
 * @param url - API endpoint (without /v2/ prefix)
 * @param headers - Additional headers
 * @param cache - Cache strategy
 * @param isStream - Whether to return a stream instead of parsed JSON
 * @returns Promise resolving to response data or stream
 *
 * @example
 * ```tsx
 * const user = await get<User>('users/123');
 * const users = await get<User[]>('users', {}, 'no-cache');
 * ```
 */
export async function get<Type>(
  url: FetchType["url"],
  headers?: object,
  cache?: RequestCache,
  isStream?: boolean
): Promise<Type | ReadableStream<Uint8Array> | null> {
  return doFetch<Type | ReadableStream<Uint8Array> | null>({
    url,
    method: "GET",
    headers,
    isStream,
    cache,
  });
}

/**
 * Performs a PUT request.
 *
 * @template Type - Expected response type
 * @param url - API endpoint (without /v2/ prefix)
 * @param body - Request body (will be JSON stringified unless FormData)
 * @param isStream - Whether to return a stream instead of parsed JSON
 * @returns Promise resolving to response data or stream
 *
 * @example
 * ```tsx
 * const updated = await put<User>('users/123', { name: 'John Doe' });
 * ```
 */
export async function put<Type>(
  url: FetchType["url"],
  body: FetchType["body"],
  isStream?: boolean
): Promise<Type | ReadableStream<Uint8Array> | null> {
  return doFetch<Type | ReadableStream<Uint8Array> | null>({
    url,
    method: "PUT",
    body,
    isStream,
  });
}

/**
 * Performs a POST request.
 *
 * @template Type - Expected response type
 * @param url - API endpoint (without /v2/ prefix)
 * @param body - Request body (will be JSON stringified unless FormData)
 * @param headers - Additional headers
 * @param isStream - Whether to return a stream instead of parsed JSON
 * @returns Promise resolving to response data or stream
 *
 * @example
 * ```tsx
 * const created = await post<User>('users', { name: 'Jane Doe' });
 * const formData = new FormData();
 * formData.append('file', file);
 * await post('upload', formData);
 * ```
 */
export async function post<Type>(
  url: FetchType["url"],
  body: FetchType["body"],
  headers?: object | null,
  isStream?: boolean
): Promise<Type | ReadableStream<Uint8Array> | null> {
  return doFetch<Type | ReadableStream<Uint8Array> | null>({
    url,
    method: "POST",
    body,
    isStream,
    headers: headers || undefined,
  });
}

/**
 * Performs a DELETE request.
 *
 * @template Type - Expected response type
 * @param url - API endpoint (without /v2/ prefix)
 * @param body - Optional request body
 * @param isStream - Whether to return a stream instead of parsed JSON
 * @returns Promise resolving to response data or stream
 *
 * @example
 * ```tsx
 * await del('users/123');
 * ```
 */
export async function del<Type>(
  url: FetchType["url"],
  body?: FetchType["body"],
  isStream?: boolean
): Promise<Type | ReadableStream<Uint8Array> | null> {
  return doFetch<Type | ReadableStream<Uint8Array> | null>({
    url,
    method: "DELETE",
    body,
    isStream,
  });
}

/**
 * Performs a PATCH request.
 *
 * @template Type - Expected response type
 * @param url - API endpoint (without /v2/ prefix)
 * @param body - Request body (will be JSON stringified unless FormData)
 * @param isStream - Whether to return a stream instead of parsed JSON
 * @returns Promise resolving to response data or stream
 *
 * @example
 * ```tsx
 * const updated = await patch<User>('users/123', { name: 'John Smith' });
 * ```
 */
export async function patch<Type>(
  url: FetchType["url"],
  body: FetchType["body"],
  isStream?: boolean
): Promise<Type | ReadableStream<Uint8Array> | null> {
  return doFetch<Type | ReadableStream<Uint8Array> | null>({
    url,
    method: "PATCH",
    body,
    isStream,
  });
}

// ============================================================================
// Stream Utilities
// ============================================================================

/**
 * Reads all data from a ReadableStream and returns it as a string.
 * Useful for consuming streaming responses.
 *
 * @param stream - The ReadableStream to read from
 * @returns Promise resolving to the complete stream data as a string
 *
 * @example
 * ```tsx
 * const stream = await get('data/stream', {}, 'default', true);
 * const data = await readDataFromStream(stream);
 * ```
 */
export async function readDataFromStream(
  stream: ReadableStream<Uint8Array>
): Promise<string> {
  const reader = stream.getReader();
  let totalData = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalData += new TextDecoder("utf-8").decode(value);
    }
  } catch (error) {
    console.error("Error reading stream:", error);
  } finally {
    reader.releaseLock();
  }

  return totalData;
}

// ============================================================================
// Type Exports
// ============================================================================

export type { FetchType, ApiError };
