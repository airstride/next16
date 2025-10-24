export enum Permissions {
  READ_PROJECTS = "READ_PROJECTS",
  WRITE_PROJECTS = "WRITE_PROJECTS",
  WRITE_INVITE = "propelauth::can_invite",
  WRITE_API_KEYS = "propelauth::can_manage_api_keys",
  WRITE_USER_ROLES = "propelauth::can_change_roles",
  WRITE_ORGANISATIONS = "WRITE_ORGANISATIONS",
  READ_ORGANISATIONS = "READ_ORGANISATIONS",
  READ_USERS = "READ_USERS",
  WRITE_USERS = "WRITE_USERS",
  WRITE_USER_PASSWORDS = "WRITE_USER_PASSWORDS",
}

export enum UserType {
  GROWTHMIND = "GROWTHMIND",
  USER = "USER",
}

export enum UserRole {
  GROWTHMIND_ADMIN = "GROWTHMIND_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

/**
 * Get user type from role
 * Maps PropelAuth roles to application user types
 */
export function getUserType(role: UserRole): UserType {
  if (role === UserRole.GROWTHMIND_ADMIN) {
    return UserType.GROWTHMIND;
  }
  return UserType.USER;
}
