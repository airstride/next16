import type { AuthUser } from "@/shared/auth/auth.service";
import { Permissions, UserRole } from "./types";

/**
 * Utility type to convert SNAKE_CASE to PascalCase
 * Example: READ_CLIENTS -> ReadClients, VIEW_BILLING -> ViewBilling
 */
type SnakeToPascal<S extends string> = S extends `${infer First}_${infer Rest}`
  ? `${Capitalize<Lowercase<First>>}${SnakeToPascal<Rest>}`
  : Capitalize<Lowercase<S>>;

/**
 * Type that enforces all permissions have corresponding can* methods
 * This creates a compile-time error if you add a permission without adding its method
 *
 * Maps enum keys (e.g., READ_CLIENTS) to method names (e.g., canReadClients)
 *
 * Example:
 * - READ_CLIENTS -> canReadClients(orgId?: string): boolean
 * - WRITE_BILLING -> canWriteBilling(orgId?: string): boolean
 */
type PermissionMethods = {
  [K in keyof typeof Permissions as `can${SnakeToPascal<K & string>}`]: (
    orgId?: string
  ) => boolean;
};

/**
 * Server-side Permissions Utility
 *
 * Provides convenient permission checking functions for server-side code using our AuthUser type.
 * This is the server-side equivalent of the usePermissions hook.
 *
 * @param user - AuthUser instance (PropelAuth user)
 * @param activeOrgId - The organization ID to check permissions for (optional, uses active org if not provided)
 */
export class ServerPermissions implements PermissionMethods {
  private user: AuthUser;
  private activeOrgId?: string;

  constructor(user: AuthUser, activeOrgId?: string) {
    this.user = user;
    this.activeOrgId = activeOrgId || user.getActiveOrg()?.orgId;
  }

  // ===== CORE PERMISSION FUNCTIONS =====

  /**
   * Get org member info for a specific organization
   */
  private getOrgMemberInfo(orgId?: string) {
    const targetOrgId = orgId || this.activeOrgId;
    if (!targetOrgId) return null;
    return this.user.getOrg(targetOrgId);
  }

  /**
   * Check if user has a specific permission in the organization
   */
  hasPermission(permission: Permissions, orgId?: string): boolean {
    const org = this.getOrgMemberInfo(orgId);
    if (!org) return false;
    return org.hasPermission(permission);
  }

  /**
   * Check if user has a specific role in the organization
   */
  hasRole(role: UserRole, orgId?: string): boolean {
    const org = this.getOrgMemberInfo(orgId);
    if (!org) return false;
    return org.isRole(role);
  }

  /**
   * Check if user has at least a specific role in the organization (hierarchical)
   */
  hasAtLeastRole(role: UserRole, orgId?: string): boolean {
    const org = this.getOrgMemberInfo(orgId);
    if (!org) return false;
    return org.isAtLeastRole(role);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: Permissions[], orgId?: string): boolean {
    return permissions.some((permission) =>
      this.hasPermission(permission, orgId)
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: Permissions[], orgId?: string): boolean {
    const org = this.getOrgMemberInfo(orgId);
    if (!org) return false;
    return org.hasAllPermissions(permissions);
  }

  /**
   * Get all permissions for the user in the organization
   */
  getPermissions(orgId?: string): string[] {
    const org = this.getOrgMemberInfo(orgId);
    return org?.userPermissions || [];
  }

  // ===== CONVENIENCE ROLE CHECKS =====

  isGrowthmindAdmin(orgId?: string): boolean {
    return this.hasRole(UserRole.GROWTHMIND_ADMIN, orgId);
  }

  isAdmin(orgId?: string): boolean {
    return this.hasRole(UserRole.ADMIN, orgId);
  }

  // ===== CONVENIENCE PERMISSION CHECKS =====
  // These methods are enforced by the PermissionMethods type
  // When you add a new permission to the Permissions enum, you MUST add a corresponding method here

  canReadClients(orgId?: string): boolean {
    return this.hasPermission(Permissions.READ_CLIENTS, orgId);
  }

  canWriteClients(orgId?: string): boolean {
    return this.hasPermission(Permissions.WRITE_CLIENTS, orgId);
  }

  canWriteInvite(orgId?: string): boolean {
    return this.hasPermission(Permissions.WRITE_INVITE, orgId);
  }

  canWriteApiKeys(orgId?: string): boolean {
    return this.hasPermission(Permissions.WRITE_API_KEYS, orgId);
  }

  canWriteUserRoles(orgId?: string): boolean {
    return this.hasPermission(Permissions.WRITE_USER_ROLES, orgId);
  }

  canWriteOrganisations(orgId?: string): boolean {
    return this.hasPermission(Permissions.WRITE_ORGANISATIONS, orgId);
  }

  canReadOrganisations(orgId?: string): boolean {
    return this.hasPermission(Permissions.READ_ORGANISATIONS, orgId);
  }

  canReadUsers(orgId?: string): boolean {
    return this.hasPermission(Permissions.READ_USERS, orgId);
  }

  canWriteUsers(orgId?: string): boolean {
    return this.hasPermission(Permissions.WRITE_USERS, orgId);
  }

  canWriteUserPasswords(orgId?: string): boolean {
    return this.hasPermission(Permissions.WRITE_USER_PASSWORDS, orgId);
  }

  canViewBilling(orgId?: string): boolean {
    return this.hasPermission(Permissions.VIEW_BILLING, orgId);
  }

  canWriteBilling(orgId?: string): boolean {
    return this.hasPermission(Permissions.WRITE_BILLING, orgId);
  }

  // ===== ORGANIZATION-SPECIFIC FUNCTIONS =====

  /**
   * Get permissions instance for a specific organization
   */
  inOrg(orgId: string): ServerPermissions {
    return new ServerPermissions(this.user, orgId);
  }

  // ===== MULTI-ORGANIZATION FUNCTIONS =====

  /**
   * Check if user has permission in any organization they belong to
   */
  canInAnyOrg(permission: Permissions): boolean {
    return this.user.getOrgs().some((org) => org.hasPermission(permission));
  }

  /**
   * Check if user has role in any organization they belong to
   */
  hasRoleInAnyOrg(role: UserRole): boolean {
    return this.user.getOrgs().some((org) => org.isRole(role));
  }

  /**
   * Get all organizations where user has specific permission
   */
  getAllOrgsWithPermission(permission: Permissions): string[] {
    return this.user
      .getOrgs()
      .filter((org) => org.hasPermission(permission))
      .map((org) => org.orgId);
  }

  /**
   * Get all organizations where user has specific role
   */
  getAllOrgsWithRole(role: UserRole): string[] {
    return this.user
      .getOrgs()
      .filter((org) => org.isRole(role))
      .map((org) => org.orgId);
  }

  // ===== VALIDATION FUNCTIONS =====

  /**
   * Validate a permission configuration against this user's permissions
   * Used by API HOFs like withAuth to enforce access control
   *
   * @param config - Permission configuration to validate
   * @returns true if user meets all requirements, false otherwise
   */
  validateConfig(config: PermissionConfig): boolean {
    if (config.requiredPermissions?.length) {
      if (!config.requiredPermissions.every((p) => this.hasPermission(p)))
        return false;
    }
    if (config.anyPermissions?.length) {
      if (!config.anyPermissions.some((p) => this.hasPermission(p)))
        return false;
    }
    if (config.allPermissions?.length) {
      if (!this.hasAllPermissions(config.allPermissions)) return false;
    }
    if (config.requiredRoles?.length) {
      if (!config.requiredRoles.every((r) => this.hasRole(r))) return false;
    }
    if (config.anyRoles?.length) {
      if (!config.anyRoles.some((r) => this.hasRole(r))) return false;
    }
    if (config.customCheck) return config.customCheck(this);
    return true;
  }
}

/**
 * Permission configuration for access control
 * Used by API HOFs like withAuth to enforce permissions
 */
export type PermissionConfig = {
  requiredPermissions?: Permissions[];
  anyPermissions?: Permissions[];
  allPermissions?: Permissions[];
  requiredRoles?: UserRole[];
  anyRoles?: UserRole[];
  customCheck?: (permissions: ServerPermissions) => boolean;
};

/**
 * Factory function to create a ServerPermissions instance
 *
 * @param user - AuthUser instance
 * @param activeOrgId - Optional organization ID to use as default
 * @returns ServerPermissions instance
 */
export function createServerPermissions(
  user: AuthUser,
  activeOrgId?: string
): ServerPermissions {
  return new ServerPermissions(user, activeOrgId);
}

export default ServerPermissions;
