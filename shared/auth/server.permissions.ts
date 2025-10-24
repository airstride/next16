import type { AuthUser } from "@/shared/auth/auth.service";

/**
 * Server-side Permissions Utility
 *
 * Provides convenient permission checking functions for server-side code using our AuthUser type.
 * This is the server-side equivalent of the usePermissions hook.
 *
 * @param user - AuthUser instance (PropelAuth user)
 * @param activeOrgId - The organization ID to check permissions for (optional, uses active org if not provided)
 */
export class ServerPermissions {
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
  hasPermission(permission: string, orgId?: string): boolean {
    const org = this.getOrgMemberInfo(orgId);
    if (!org) return false;
    return org.hasPermission(permission);
  }

  /**
   * Check if user has a specific role in the organization
   */
  hasRole(role: string, orgId?: string): boolean {
    const org = this.getOrgMemberInfo(orgId);
    if (!org) return false;
    return org.isRole(role);
  }

  /**
   * Check if user has at least a specific role in the organization (hierarchical)
   */
  hasAtLeastRole(role: string, orgId?: string): boolean {
    const org = this.getOrgMemberInfo(orgId);
    if (!org) return false;
    return org.isAtLeastRole(role);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[], orgId?: string): boolean {
    return permissions.some((permission) =>
      this.hasPermission(permission, orgId)
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: string[], orgId?: string): boolean {
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

  isAirstrideAdmin(orgId?: string): boolean {
    return this.hasRole("AIRSTRIDE_ADMIN", orgId);
  }

  isVendorAdmin(orgId?: string): boolean {
    return this.hasRole("VENDOR_ADMIN", orgId);
  }

  isVendorUser(orgId?: string): boolean {
    return this.hasRole("VENDOR_USER", orgId);
  }

  isPartnerAdmin(orgId?: string): boolean {
    return this.hasRole("PARTNER_ADMIN", orgId);
  }

  isPartnerUser(orgId?: string): boolean {
    return this.hasRole("PARTNER_USER", orgId);
  }

  // Role group checks
  isVendor(orgId?: string): boolean {
    return (
      this.hasRole("VENDOR_ADMIN", orgId) || this.hasRole("VENDOR_USER", orgId)
    );
  }

  isPartner(orgId?: string): boolean {
    return (
      this.hasRole("PARTNER_ADMIN", orgId) ||
      this.hasRole("PARTNER_USER", orgId)
    );
  }

  isAdmin(orgId?: string): boolean {
    return (
      this.hasRole("AIRSTRIDE_ADMIN", orgId) ||
      this.hasRole("VENDOR_ADMIN", orgId) ||
      this.hasRole("PARTNER_ADMIN", orgId)
    );
  }

  // ===== CONVENIENCE PERMISSION CHECKS =====

  // File & Collaboration permissions
  canUploadFiles(orgId?: string): boolean {
    return this.hasPermission("UPLOAD_FILES", orgId);
  }

  canAssignFilePermissions(orgId?: string): boolean {
    return this.hasPermission("ASSIGN_FILE_PERMISSIONS", orgId);
  }

  canViewFiles(orgId?: string): boolean {
    return this.hasPermission("VIEW_FILES", orgId);
  }

  canWriteFiles(orgId?: string): boolean {
    return this.hasPermission("WRITE_FILES", orgId);
  }

  canDeleteFiles(orgId?: string): boolean {
    return this.hasPermission("DELETE_FILES", orgId);
  }

  canManageFiles(orgId?: string): boolean {
    return this.hasPermission("MANAGE_FILES", orgId);
  }

  canReadFile(orgId?: string): boolean {
    return this.hasPermission("READ_FILE", orgId);
  }

  canWriteFile(orgId?: string): boolean {
    return this.hasPermission("WRITE_FILE", orgId);
  }

  // Folder permissions
  canViewFolders(orgId?: string): boolean {
    return this.hasPermission("VIEW_FOLDERS", orgId);
  }

  canWriteFolder(orgId?: string): boolean {
    return this.hasPermission("WRITE_FOLDER", orgId);
  }

  canCreateFolders(orgId?: string): boolean {
    return this.hasPermission("CREATE_FOLDERS", orgId);
  }

  canDeleteFolders(orgId?: string): boolean {
    return this.hasPermission("DELETE_FOLDERS", orgId);
  }

  canManageFolders(orgId?: string): boolean {
    return this.hasPermission("MANAGE_FOLDERS", orgId);
  }

  canReadFolder(orgId?: string): boolean {
    return this.hasPermission("READ_FOLDER", orgId);
  }

  // Deal permissions
  canSubmitDeals(orgId?: string): boolean {
    return this.hasPermission("SUBMIT_DEALS", orgId);
  }

  canApproveDeals(orgId?: string): boolean {
    return this.hasPermission("APPROVE_DEALS", orgId);
  }

  canRejectDeals(orgId?: string): boolean {
    return this.hasPermission("REJECT_DEALS", orgId);
  }

  canViewDeals(orgId?: string): boolean {
    return this.hasPermission("VIEW_DEALS", orgId);
  }

  canEditDeals(orgId?: string): boolean {
    return this.hasPermission("EDIT_DEALS", orgId);
  }

  canManageDeals(orgId?: string): boolean {
    return this.hasPermission("MANAGE_DEALS", orgId);
  }

  canUploadDealDocuments(orgId?: string): boolean {
    return this.hasPermission("UPLOAD_DEAL_DOCUMENTS", orgId);
  }

  canViewDealDocuments(orgId?: string): boolean {
    return this.hasPermission("VIEW_DEAL_DOCUMENTS", orgId);
  }

  // User management permissions
  canInviteUsers(orgId?: string): boolean {
    return this.hasPermission("INVITE_USERS", orgId);
  }

  canRemoveUsers(orgId?: string): boolean {
    return this.hasPermission("REMOVE_USERS", orgId);
  }

  canManageUsers(orgId?: string): boolean {
    return this.hasPermission("MANAGE_USERS", orgId);
  }

  canViewUsers(orgId?: string): boolean {
    return this.hasPermission("VIEW_USERS", orgId);
  }

  canEditUserRoles(orgId?: string): boolean {
    return this.hasPermission("EDIT_USER_ROLES", orgId);
  }

  // Analytics permissions
  canViewAnalytics(orgId?: string): boolean {
    return this.hasPermission("VIEW_ANALYTICS", orgId);
  }

  canEditAnalytics(orgId?: string): boolean {
    return this.hasPermission("EDIT_ANALYTICS", orgId);
  }

  canManageAnalytics(orgId?: string): boolean {
    return this.hasPermission("MANAGE_ANALYTICS", orgId);
  }

  canExportAnalytics(orgId?: string): boolean {
    return this.hasPermission("EXPORT_ANALYTICS", orgId);
  }

  canAccessAnalytics(orgId?: string): boolean {
    return this.hasPermission("ACCESS_ANALYTICS", orgId);
  }

  // Partner management permissions
  canViewPartnerDirectory(orgId?: string): boolean {
    return this.hasPermission("VIEW_PARTNER_DIRECTORY", orgId);
  }

  canUseOutreachTools(orgId?: string): boolean {
    return this.hasPermission("USE_OUTREACH_TOOLS", orgId);
  }

  canEditOrgProfile(orgId?: string): boolean {
    return this.hasPermission("EDIT_ORG_PROFILE", orgId);
  }

  canManagePartners(orgId?: string): boolean {
    return this.hasPermission("MANAGE_PARTNERS", orgId);
  }

  canViewPartners(orgId?: string): boolean {
    return this.hasPermission("VIEW_PARTNERS", orgId);
  }

  canCreatePartners(orgId?: string): boolean {
    return this.hasPermission("CREATE_PARTNERS", orgId);
  }

  canDeletePartners(orgId?: string): boolean {
    return this.hasPermission("DELETE_PARTNERS", orgId);
  }

  canAccessPartnerLists(orgId?: string): boolean {
    return this.hasPermission("ACCESS_PARTNER_LISTS", orgId);
  }

  canManagePartnerLists(orgId?: string): boolean {
    return this.hasPermission("MANAGE_PARTNER_LISTS", orgId);
  }

  // Settings permissions
  canViewSettings(orgId?: string): boolean {
    return this.hasPermission("VIEW_SETTINGS", orgId);
  }

  canEditSettings(orgId?: string): boolean {
    return this.hasPermission("EDIT_SETTINGS", orgId);
  }

  canManageSettings(orgId?: string): boolean {
    return this.hasPermission("MANAGE_SETTINGS", orgId);
  }

  canAccessSystemSettings(orgId?: string): boolean {
    return this.hasPermission("ACCESS_SYSTEM_SETTINGS", orgId);
  }

  canManageSystemSettings(orgId?: string): boolean {
    return this.hasPermission("MANAGE_SYSTEM_SETTINGS", orgId);
  }

  // Organization permissions
  canViewOrganization(orgId?: string): boolean {
    return this.hasPermission("VIEW_ORGANIZATION", orgId);
  }

  canEditOrganization(orgId?: string): boolean {
    return this.hasPermission("EDIT_ORGANIZATION", orgId);
  }

  canManageOrganization(orgId?: string): boolean {
    return this.hasPermission("MANAGE_ORGANIZATION", orgId);
  }

  canDeleteOrganization(orgId?: string): boolean {
    return this.hasPermission("DELETE_ORGANIZATION", orgId);
  }

  // Marketplace permissions
  canAccessMarketplace(orgId?: string): boolean {
    return this.hasPermission("ACCESS_MARKETPLACE", orgId);
  }

  canViewMarketplace(orgId?: string): boolean {
    return this.hasPermission("VIEW_MARKETPLACE", orgId);
  }

  canManageMarketplace(orgId?: string): boolean {
    return this.hasPermission("MANAGE_MARKETPLACE", orgId);
  }

  canPublishToMarketplace(orgId?: string): boolean {
    return this.hasPermission("PUBLISH_TO_MARKETPLACE", orgId);
  }

  // Task permissions
  canViewTasks(orgId?: string): boolean {
    return this.hasPermission("VIEW_TASKS", orgId);
  }

  canCreateTasks(orgId?: string): boolean {
    return this.hasPermission("CREATE_TASKS", orgId);
  }

  canEditTasks(orgId?: string): boolean {
    return this.hasPermission("EDIT_TASKS", orgId);
  }

  canDeleteTasks(orgId?: string): boolean {
    return this.hasPermission("DELETE_TASKS", orgId);
  }

  canManageTasks(orgId?: string): boolean {
    return this.hasPermission("MANAGE_TASKS", orgId);
  }

  canAssignTasks(orgId?: string): boolean {
    return this.hasPermission("ASSIGN_TASKS", orgId);
  }

  // Collaboration permissions
  canComment(orgId?: string): boolean {
    return this.hasPermission("COMMENT", orgId);
  }

  canViewComments(orgId?: string): boolean {
    return this.hasPermission("VIEW_COMMENTS", orgId);
  }

  canEditComments(orgId?: string): boolean {
    return this.hasPermission("EDIT_COMMENTS", orgId);
  }

  canDeleteComments(orgId?: string): boolean {
    return this.hasPermission("DELETE_COMMENTS", orgId);
  }

  canManageComments(orgId?: string): boolean {
    return this.hasPermission("MANAGE_COMMENTS", orgId);
  }

  canManageCollaborationFiles(orgId?: string): boolean {
    return this.hasPermission("MANAGE_COLLABORATION_FILES", orgId);
  }

  canManageCollaborationFolders(orgId?: string): boolean {
    return this.hasPermission("MANAGE_COLLABORATION_FOLDERS", orgId);
  }

  // Reporting permissions
  canViewReports(orgId?: string): boolean {
    return this.hasPermission("VIEW_REPORTS", orgId);
  }

  canCreateReports(orgId?: string): boolean {
    return this.hasPermission("CREATE_REPORTS", orgId);
  }

  canEditReports(orgId?: string): boolean {
    return this.hasPermission("EDIT_REPORTS", orgId);
  }

  canDeleteReports(orgId?: string): boolean {
    return this.hasPermission("DELETE_REPORTS", orgId);
  }

  canExportReports(orgId?: string): boolean {
    return this.hasPermission("EXPORT_REPORTS", orgId);
  }

  // Billing permissions
  canViewBilling(orgId?: string): boolean {
    return this.hasPermission("VIEW_BILLING", orgId);
  }

  canManageBilling(orgId?: string): boolean {
    return this.hasPermission("MANAGE_BILLING", orgId);
  }

  canViewInvoices(orgId?: string): boolean {
    return this.hasPermission("VIEW_INVOICES", orgId);
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
  canInAnyOrg(permission: string): boolean {
    return this.user.getOrgs().some((org) => org.hasPermission(permission));
  }

  /**
   * Check if user has role in any organization they belong to
   */
  hasRoleInAnyOrg(role: string): boolean {
    return this.user.getOrgs().some((org) => org.isRole(role));
  }

  /**
   * Get all organizations where user has specific permission
   */
  getAllOrgsWithPermission(permission: string): string[] {
    return this.user
      .getOrgs()
      .filter((org) => org.hasPermission(permission))
      .map((org) => org.orgId);
  }

  /**
   * Get all organizations where user has specific role
   */
  getAllOrgsWithRole(role: string): string[] {
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
  requiredPermissions?: string[];
  anyPermissions?: string[];
  allPermissions?: string[];
  requiredRoles?: string[];
  anyRoles?: string[];
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
