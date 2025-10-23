/**
 * Access Control Utility
 *
 * Provides utilities for applying user-level and organization-level
 * access control to query parameters based on user type and role.
 */

/**
 * Access control context containing user information
 */
export interface AccessControlContext {
  userId: string;
  userType?: "org_user" | "admin" | "super_admin";
  orgId?: string;
  role?: string;
}

/**
 * Access control utility class
 */
export class AccessControlUtil {
  /**
   * Apply access control filters to search parameters
   * @param searchParams - The search parameters to modify
   * @param context - User access control context
   * @param options - Control which access control levels to apply
   * @returns Modified search parameters with access control applied
   */
  static applyAccessControl(
    searchParams: URLSearchParams,
    context: AccessControlContext,
    options: {
      applyUserLevelControl: boolean;
      applyOrganizationLevelControl: boolean;
    } = {
      applyUserLevelControl: true,
      applyOrganizationLevelControl: true,
    }
  ): URLSearchParams {
    const params = new URLSearchParams(searchParams);

    // Apply user-level access control
    if (options.applyUserLevelControl) {
      // Only filter by userId if user is not admin or super_admin
      if (context.userType !== "admin" && context.userType !== "super_admin") {
        params.set("created_by", context.userId);
      }
    }

    // Apply organization-level access control
    if (options.applyOrganizationLevelControl) {
      // Filter by organization if orgId is provided
      if (context.orgId) {
        params.set("created_by_propel_auth_org_id", context.orgId);
      }
    }

    return params;
  }

  /**
   * Get access control parameters as an object
   * @param context - User access control context
   * @returns Object with access control parameters
   */
  static getAccessControlParams(context: AccessControlContext): Record<string, any> {
    const params: Record<string, any> = {};

    // Add user-level filter if not admin
    if (context.userType !== "admin" && context.userType !== "super_admin") {
      params.created_by = context.userId;
    }

    // Add organization-level filter if orgId is provided
    if (context.orgId) {
      params.created_by_propel_auth_org_id = context.orgId;
    }

    return params;
  }
}

