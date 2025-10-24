/**
 * User API Response
 *
 * Transforms PropelAuth user data into standardized API responses
 */

/**
 * UserResponse class
 *
 * Represents a user in API responses with PropelAuth data
 */
export class UserResponse {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  picture_url?: string;
  email_confirmed: boolean;
  can_create_orgs: boolean;
  created_at: number;
  last_active_at?: number;
  org_id_to_org_member_info?: Record<string, any>;
  metadata?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  legacy_user_id?: string;
  impersonator_user_id?: string;

  constructor(data: {
    user_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    picture_url?: string;
    email_confirmed: boolean;
    can_create_orgs: boolean;
    created_at: number;
    last_active_at?: number;
    org_id_to_org_member_info?: Record<string, any>;
    metadata?: Record<string, unknown>;
    properties?: Record<string, unknown>;
    legacy_user_id?: string;
    impersonator_user_id?: string;
  }) {
    this.user_id = data.user_id;
    this.email = data.email;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.username = data.username;
    this.picture_url = data.picture_url;
    this.email_confirmed = data.email_confirmed;
    this.can_create_orgs = data.can_create_orgs;
    this.created_at = data.created_at;
    this.last_active_at = data.last_active_at;
    this.org_id_to_org_member_info = data.org_id_to_org_member_info;
    this.metadata = data.metadata;
    this.properties = data.properties;
    this.legacy_user_id = data.legacy_user_id;
    this.impersonator_user_id = data.impersonator_user_id;
  }

  /**
   * Create UserResponse from PropelAuth user metadata
   * @param propelAuthUser - PropelAuth user object from fetchUserMetadataByUserId
   */
  static fromPropelAuthUser(propelAuthUser: any): UserResponse {
    return new UserResponse({
      user_id: propelAuthUser.userId,
      email: propelAuthUser.email,
      first_name: propelAuthUser.firstName,
      last_name: propelAuthUser.lastName,
      username: propelAuthUser.username,
      picture_url: propelAuthUser.pictureUrl,
      email_confirmed: propelAuthUser.emailConfirmed ?? false,
      can_create_orgs: propelAuthUser.canCreateOrgs ?? true,
      created_at: propelAuthUser.createdAt,
      last_active_at: propelAuthUser.lastActiveAt,
      org_id_to_org_member_info: propelAuthUser.orgIdToOrgMemberInfo,
      metadata: propelAuthUser.metadata,
      properties: propelAuthUser.properties,
      legacy_user_id: propelAuthUser.legacyUserId,
      impersonator_user_id: propelAuthUser.impersonatorUserId,
    });
  }
}
