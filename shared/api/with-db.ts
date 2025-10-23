/**
 * withDB Higher-Order Function
 *
 * Ensures database connection is initialized before route handler executes.
 * Automatically adds database connection status to error context for debugging.
 *
 * @example
 * ```typescript
 * import { withAuth, withDB } from "@/shared/api";
 *
 * export const GET = withAuth(
 *   withDB(async (req, ctx, { auth }) => {
 *     // Database is guaranteed to be connected here
 *     const users = await UserModel.find({});
 *     return successResponse({ users });
 *   })
 * );
 * ```
 */

import { NextRequest } from "next/server";
import { DatabaseService } from "@/shared/db/database.service";
import type { CoreHandler, NextRouteContext } from "@/shared/types/api-hof.types";

/**
 * Wrap a handler to ensure database is initialized
 *
 * @param handler - The route handler that requires database access
 * @returns Wrapped handler with database initialization
 */
export function withDB<
  P extends Record<string, string> = Record<string, string>,
  TProps extends Record<string, any> = Record<string, any>,
>(handler: CoreHandler<P, TProps>): CoreHandler<P, TProps> {
  return async (
    req: NextRequest,
    context: NextRouteContext<P>,
    props: TProps
  ): Promise<Response> => {
    try {
      // Ensure database is connected before proceeding
      await DatabaseService.connect();

      // Add successful database context metadata
      const dbMetadata = {
        db_connection_status: "connected",
        mongodb_database: process.env.MONGODB_DATABASE_NAME || "unknown",
      };

      // If props has a way to store metadata, add it
      // Otherwise, just proceed with the handler
      const enhancedProps = {
        ...props,
        _dbMetadata: dbMetadata,
      };

      return handler(req, context, enhancedProps);
    } catch (dbError) {
      // Enhance error with database context
      const error = dbError as Error;
      error.message = `Database initialization failed: ${error.message}`;

      // Add database error metadata
      (error as any).dbContext = {
        database_initialization_error: true,
        db_connection_status: "failed",
        mongodb_database: process.env.MONGODB_DATABASE_NAME || "unknown",
      };

      throw error;
    }
  };
}

