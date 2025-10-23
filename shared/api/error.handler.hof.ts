/**
 * Error Handler Higher-Order Function
 *
 * Wraps API route handlers with automatic error handling.
 * Ensures all errors are properly serialized and logged.
 */

import { NextRequest } from "next/server";
import { ErrorHandler } from "../utils/errors";

/**
 * Route Handler Type
 * Standard Next.js App Router handler signature
 */
type RouteHandler = (
  req: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<Response>;

/**
 * withErrorHandler
 *
 * HOF that wraps route handlers with automatic error handling.
 * Any thrown errors are caught, logged, and serialized to consistent format.
 *
 * @example
 * ```ts
 * export const GET = withErrorHandler(async (req) => {
 *   const user = await getUserById(req.params.id);
 *   if (!user) throw new NotFoundError("User");
 *   return SuccessResponse.withData(user);
 * });
 * ```
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    return ErrorHandler.handleAsync(() => handler(req, context));
  };
}

/**
 * Route Handler with Context Type
 * For handlers that need access to validated data, user, etc.
 */
type ContextualRouteHandler<TContext = Record<string, unknown>> = (
  req: NextRequest,
  context: TContext
) => Promise<Response>;

/**
 * withErrorHandlerContext
 *
 * HOF variant that preserves generic context types.
 * Use when composing with other HOFs (withAuth, withValidation, etc.)
 *
 * @example
 * ```ts
 * export const POST = withErrorHandlerContext(
 *   withAuth(async (req, { user }) => {
 *     // handler code
 *   })
 * );
 * ```
 */
export function withErrorHandlerContext<TContext>(
  handler: ContextualRouteHandler<TContext>
): (req: NextRequest, context: TContext) => Promise<Response> {
  return async (req, context) => {
    return ErrorHandler.handleAsync(() => handler(req, context));
  };
}
