/**
 * withAuth Higher-Order Function
 *
 * Handles authentication and authorization for API routes using PropelAuth.
 * Supports role-based and permission-based access control.
 *
 * @example
 * ```typescript
 * import { withAuth } from "@/shared/api";
 *
 * // Simple authentication
 * export const GET = withAuth(async (req, ctx, { auth }) => {
 *   // auth.user, auth.userId, auth.activeOrgId available
 *   return successResponse({ message: "Authenticated!" });
 * });
 *
 * // With permission requirements
 * export const POST = withAuth(
 *   async (req, ctx, { auth }) => {
 *     // Only users with required permissions can access
 *     return successResponse({ message: "Authorized!" });
 *   },
 *   {
 *     requiredPermissions: ["users:write"],
 *     requiredRoles: ["Admin"],
 *   }
 * );
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/shared/auth/auth.service";
import type {
  CoreHandler,
  NextRouteContext,
  NextRouteHandler,
} from "@/shared/types/api-hof.types";

/**
 * Authentication properties injected into handler
 */
export type WithAuthProps = {
  /** PropelAuth user object */
  user: any; // Replace with your AuthUser type
  /** User ID from PropelAuth */
  userId: string;
  /** User's active organization ID */
  activeOrgId: string;
  /** User's active organization name */
  activeOrgName: string;
  /** User's role in the active organization */
  role: string;
  /** User's full name */
  name: string;
  /** User's email */
  email: string;
};

/**
 * Permission configuration for access control
 */
export type PermissionConfig = {
  /** All of these permissions are required */
  requiredPermissions?: string[];
  /** At least one of these permissions is required */
  anyPermissions?: string[];
  /** All of these permissions must be present */
  allPermissions?: string[];
  /** All of these roles are required */
  requiredRoles?: string[];
  /** At least one of these roles is required */
  anyRoles?: string[];
  /** Custom permission check function */
  customCheck?: (authProps: WithAuthProps) => boolean;
};

/**
 * Validate user permissions against configuration
 *
 * @param authProps - Authentication properties to check
 * @param config - Permission configuration
 * @returns True if user has required permissions, false otherwise
 */
function validatePermissions(authProps: WithAuthProps, config: PermissionConfig): boolean {
  // For role-based checks
  if (config.requiredRoles?.length) {
    if (!config.requiredRoles.includes(authProps.role)) {
      return false;
    }
  }

  if (config.anyRoles?.length) {
    if (!config.anyRoles.includes(authProps.role)) {
      return false;
    }
  }

  // Note: Permission checks would require a permission system
  // You'll need to implement this based on your PropelAuth setup
  // For now, we skip permission validation if not implemented

  if (config.customCheck) {
    return config.customCheck(authProps);
  }

  return true;
}

/**
 * Higher-order function for authentication and authorization
 *
 * This HOF is special - it transforms a CoreHandler into a NextRouteHandler
 * because it's typically the outermost HOF in the composition chain.
 *
 * @param handler - Route handler that receives auth props
 * @param permissionConfig - Optional permission/role requirements
 * @returns Next.js route handler with authentication
 */
export function withAuth<P extends Record<string, string> = Record<string, string>>(
  handler: CoreHandler<P, { auth: WithAuthProps }>,
  permissionConfig?: PermissionConfig
): NextRouteHandler<P> {
  return async (req: NextRequest, context: NextRouteContext<P>): Promise<Response> => {
    try {
      // Extract authorization header
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "You must be logged in.",
          },
          { status: 401 }
        );
      }

      // Get user from PropelAuth
      const user = await AuthService.getUserFromAuthHeader(authHeader);
      if (!user) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Invalid authentication token.",
          },
          { status: 401 }
        );
      }

      // Get active organization
      const activeOrg = user.getActiveOrg() || user.getOrgs()[0];
      if (!activeOrg) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "You must be a member of an organization.",
          },
          { status: 401 }
        );
      }

      // Build auth props
      const authProps: WithAuthProps = {
        user,
        userId: user.userId,
        activeOrgId: activeOrg.orgId,
        activeOrgName: activeOrg.orgName,
        role: activeOrg.assignedRole,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      };

      // Validate permissions if configured
      if (permissionConfig) {
        const hasPermission = validatePermissions(authProps, permissionConfig);
        if (!hasPermission) {
          return NextResponse.json(
            {
              error: "Forbidden",
              message: "You do not have permission to access this resource.",
            },
            { status: 403 }
          );
        }
      }

      // Call handler with auth props
      return handler(req, context, { auth: authProps });
    } catch (error) {
      console.error("Authentication error:", error);

      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Authentication failed.",
        },
        { status: 401 }
      );
    }
  };
}

/**
 * Compose multiple HOFs together
 * Helper for better ergonomics when using multiple HOFs
 *
 * @example
 * ```typescript
 * export const POST = compose(
 *   withAuth,
 *   withDB,
 *   withValidation(createUserSchema)
 * )(async (req, ctx, { auth, body }) => {
 *   // Handler with all HOFs applied
 *   return successResponse({ user: body });
 * });
 * ```
 */
export function compose<P extends Record<string, string> = Record<string, string>>(
  ...hofs: Array<(handler: any) => any>
) {
  return (handler: CoreHandler<P, any>): NextRouteHandler<P> => {
    return hofs.reduceRight((acc, hof) => hof(acc), handler) as NextRouteHandler<P>;
  };
}

