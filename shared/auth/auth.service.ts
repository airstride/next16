import {
  getPropelAuthApis,
  validateAccessToken,
} from "@propelauth/nextjs/server";
import type {
  CreateOrgRequest,
  Org,
  FetchPendingInvitesParams as PropelAuthFetchPendingInvitesParams,
  OrgIdToOrgMemberInfo as PropelAuthOrgIdToOrgMemberInfo,
  UserFromToken,
  UsersInOrgQuery,
} from "@propelauth/nextjs/server";

/**
 * Local type aliases for PropelAuth types
 * This allows us to decouple our codebase from PropelAuth's type exports
 * and makes it easier to swap auth providers in the future if needed
 */
export type AuthUser = UserFromToken;
export type AuthCreatedOrg = Org;
export type AuthCreateOrgRequest = CreateOrgRequest;
export type AuthOrgIdToOrgMemberInfo = PropelAuthOrgIdToOrgMemberInfo;
export type AuthFetchPendingInvitesParams = PropelAuthFetchPendingInvitesParams;
export type AuthUsersInOrgQuery = UsersInOrgQuery;

/**
 * Custom error class for PropelAuth errors
 */
class PropelAuthError extends Error {
  public readonly details: unknown;
  public readonly status: number;

  constructor(message: string, details: unknown = null, status: number = 400) {
    super(message);
    this.name = "PropelAuthError";
    this.details = details;
    this.status = status;
  }
}

/**
 * Helper function to handle PropelAuth errors
 */
const handlePropelAuthError = (error: unknown): never => {
  const err = error as Record<string, unknown>;

  // Check if it's a PropelAuth validation error with field details
  if (err.response || err.data || err.message) {
    const response = err.response as Record<string, unknown> | undefined;
    let errorData: unknown = response?.data || err.data || err.message;

    // Parse JSON string if needed
    if (typeof errorData === "string") {
      const errorString = errorData;
      try {
        errorData = JSON.parse(errorString);
      } catch {
        // If it's not valid JSON, treat it as a regular message
        throw new PropelAuthError(errorString, null, 400);
      }
    }

    // Extract the first field error as the main message
    let mainMessage = "Validation failed";
    if (typeof errorData === "object" && errorData !== null) {
      const dataObj = errorData as Record<string, unknown>;
      const firstField = Object.keys(dataObj)[0];
      const fieldValue = dataObj[firstField];
      if (firstField && Array.isArray(fieldValue) && fieldValue.length > 0) {
        mainMessage = String(fieldValue[0]);
      }
    }

    throw new PropelAuthError(mainMessage, errorData, 400);
  }

  // Handle other PropelAuth errors
  const response = err.response as Record<string, unknown> | undefined;
  if (response?.status) {
    const status = response.status as number;
    const responseData = response.data as Record<string, unknown> | undefined;
    const message =
      (responseData?.message as string) ||
      (err.message as string) ||
      "PropelAuth operation failed";
    throw new PropelAuthError(message, response.data, status);
  }

  // Fallback for unknown PropelAuth errors
  throw new PropelAuthError(
    (err.message as string) || "PropelAuth operation failed",
    null,
    500
  );
};

export async function getUserFromAuthHeader(authorizationHeader: string) {
  try {
    // Extract the token from "Bearer <token>" format
    const token = authorizationHeader?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return null;
    }
    return await validateAccessToken(token);
  } catch (error) {
    console.error("Error validating access token:", error);
    return null;
  }
}

/**
 * Sanitizes organization name for PropelAuth by removing special characters
 * PropelAuth only allows alphanumeric characters, underscores, and spaces
 * @param name - The organization name to sanitize
 * @returns Sanitized organization name
 */
export const sanitizeOrganizationName = (name: string): string => {
  if (!name) return name;

  // Replace special characters (keeping only alphanumeric, underscore, and spaces)
  return name.replace(/[^a-zA-Z0-9_\s]/g, "").trim();
};

/** Helper function to get PropelAuth APIs */
const getApis = () => {
  return getPropelAuthApis();
};

/** Gets all users by query */
export const getUsersByQuery = async (query: {
  emailOrUsername?: string;
  legacyUserId?: string;
  includeOrgs?: boolean;
  orderBy?: "CREATED_AT_DESC" | "CREATED_AT_ASC";
  pageNumber?: number;
  pageSize?: number;
}) => {
  try {
    const apis = getApis();
    return await apis.fetchUsersByQuery(query);
  } catch (error) {
    handlePropelAuthError(error);
  }
};

/** Gets all users in an organization */
export const getUsersByOrg = async (query: {
  orgId: string;
  includeOrgs: boolean;
  pageNumber?: number;
  pageSize?: number;
  role?: string;
}) => {
  try {
    const apis = getApis();
    return await apis.fetchUsersInOrg(query);
  } catch (error) {
    handlePropelAuthError(error);
  }
};

/** Gets all invites in an organization */
export const getInvitesByOrg = async (query: {
  orgId: string;
  pageNumber?: number;
  pageSize?: number;
}) => {
  try {
    const apis = getApis();
    return await apis.fetchPendingInvites(query);
  } catch (error) {
    handlePropelAuthError(error);
  }
};

/** Revokes an invite */
export const revokeInvite = async (params: {
  inviteeEmail: string;
  orgId: string;
}) => {
  try {
    const apis = getApis();
    return await apis.revokePendingOrgInvite(params);
  } catch (error) {
    handlePropelAuthError(error);
  }
};

/** Updates a user's password */
export const updateUserPassword = async (userId: string, password: string) => {
  try {
    const apis = getApis();
    return await apis.updateUserPassword(userId, {
      password,
      askUserToUpdatePasswordOnLogin: false,
    });
  } catch (error) {
    handlePropelAuthError(error);
  }
};

/** Gets all list of organizations */
export const getOrganisations = async (name?: string, domain?: string) => {
  try {
    const apis = getApis();
    const organizations = await apis.fetchOrgByQuery({
      name,
      domain,
    });
    const updatedOrganizations = organizations?.orgs
      ? await Promise.all(
          organizations.orgs.map(async (org) => {
            const details = await getOrganisation(org.orgId);
            return { ...org, details };
          })
        )
      : [];
    organizations.orgs = updatedOrganizations;
    return organizations;
  } catch (error) {
    handlePropelAuthError(error);
  }
};

/** Gets an organization by ID */
export const getOrganisation = async (orgId: string) => {
  try {
    const apis = getApis();
    return await apis.fetchOrg(orgId);
  } catch (error) {
    handlePropelAuthError(error);
  }
};

/** Creates a new organization */
export const createOrganisation = async (
  orgData: AuthCreateOrgRequest
): Promise<AuthCreatedOrg | undefined> => {
  try {
    const apis = getApis();
    // Sanitize organization name before sending to PropelAuth
    const sanitizedOrgData = {
      ...orgData,
      name: sanitizeOrganizationName(orgData.name),
    };
    return (await apis.createOrg(sanitizedOrgData)) as AuthCreatedOrg;
  } catch (error) {
    handlePropelAuthError(error);
  }
};

/** Deletes an organization by ID */
export const deleteOrganisation = async (orgId: string) => {
  try {
    const apis = getApis();
    return await apis.deleteOrg(orgId);
  } catch (error) {
    handlePropelAuthError(error);
  }
};

/** Updates an organization */
export const updateOrganisation = async (
  orgId: string,
  orgData: {
    name?: string;
    canSetupSaml?: boolean;
    maxUsers?: number;
    metadata?: Record<string, unknown>;
    canJoinOnEmailDomainMatch?: boolean;
    membersMustHaveEmailDomainMatch?: boolean;
    domain?: string;
    require2faBy?: string;
    extraDomains?: string[];
  }
) => {
  try {
    const apis = getApis();
    return await apis.updateOrg({
      orgId,
      ...orgData,
    });
  } catch (error) {
    console.error("Error updating organisation:", error);
    handlePropelAuthError(error);
  }
};

/** Invites a user to an organization */
export const inviteUser = async (params: {
  email: string;
  orgId: string;
  role: string;
  additionalRoles: string[];
}) => {
  try {
    const apis = getApis();
    return await apis.inviteUserToOrg(params);
  } catch (error) {
    handlePropelAuthError(error);
  }
};

/** Removes a user from an organization */
export const removeUserFromOrg = async (params: {
  userId: string;
  orgId: string;
}) => {
  try {
    const apis = getApis();
    return await apis.removeUserFromOrg(params);
  } catch (error) {
    handlePropelAuthError(error);
  }
};

/** Updates a user's role in an organization */
export const updateUserRoleInOrg = async (params: {
  userId: string;
  orgId: string;
  role: string;
}) => {
  try {
    const apis = getApis();
    return await apis.changeUserRoleInOrg(params);
  } catch (error) {
    handlePropelAuthError(error);
  }
};

/** Updates a user */
export const updateUser = async (
  userId: string,
  userData: {
    firstName?: string;
    lastName?: string;
    pictureUrl?: string;
    metadata?: {
      [key: string]: unknown;
    };
    properties?: {
      [key: string]: unknown;
    };
  }
) => {
  try {
    const apis = getApis();
    return await apis.updateUserMetadata(userId, {
      firstName: userData.firstName,
      lastName: userData.lastName,
      pictureUrl: userData.pictureUrl,
      metadata: userData.metadata,
      properties: userData.properties,
    });
  } catch (error) {
    handlePropelAuthError(error);
  }
};

export const getUser = async (userId: string) => {
  try {
    const apis = getApis();
    return await apis.fetchUserMetadataByUserId(userId, true);
  } catch (error) {
    handlePropelAuthError(error);
  }
};

// delete user
export const deleteUser = async (userId: string) => {
  try {
    const apis = getApis();
    return await apis.deleteUser(userId);
  } catch (error) {
    handlePropelAuthError(error);
  }
};
