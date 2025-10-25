# Permissions Type Safety Guide

## Overview

The `ServerPermissions` class now has compile-time type safety that ensures every permission in the `Permissions` enum has a corresponding convenience method.

## How It Works

When you add a new permission to the `Permissions` enum, TypeScript will automatically require you to add a corresponding method to the `ServerPermissions` class.

### Example

**Step 1: Add a new permission to the enum**

```typescript
// shared/auth/types.ts
export enum Permissions {
  READ_CLIENTS = "READ_CLIENTS",
  WRITE_CLIENTS = "WRITE_CLIENTS",
  // ... other permissions
  MANAGE_REPORTS = "MANAGE_REPORTS", // ✨ New permission added
}
```

**Step 2: TypeScript will show an error**

TypeScript will immediately show a compile error:
```
Class 'ServerPermissions' incorrectly implements interface 'PermissionMethods'.
Property 'canManageReports' is missing in type 'ServerPermissions'.
```

**Step 3: Add the required method**

```typescript
// shared/auth/server.permissions.ts
export class ServerPermissions implements PermissionMethods {
  // ... existing methods

  canManageReports(orgId?: string): boolean {
    return this.hasPermission(Permissions.MANAGE_REPORTS, orgId);
  }
}
```

## Naming Convention

The type system automatically converts permission names using this pattern:

- **Enum Key** (SNAKE_CASE) → **Method Name** (camelCase with "can" prefix)
- `READ_CLIENTS` → `canReadClients`
- `WRITE_BILLING` → `canWriteBilling`
- `MANAGE_REPORTS` → `canManageReports`
- `WRITE_USER_PASSWORDS` → `canWriteUserPasswords`

## Benefits

1. **Type Safety**: You can't forget to add a permission method
2. **Autocomplete**: IDEs will show all available permission methods
3. **Refactoring**: Renaming a permission will show all places that need updates
4. **Documentation**: The type serves as documentation of what methods are required

## Current Permissions

All current permissions have their corresponding methods:

| Permission | Method |
|-----------|--------|
| `READ_CLIENTS` | `canReadClients(orgId?: string): boolean` |
| `WRITE_CLIENTS` | `canWriteClients(orgId?: string): boolean` |
| `WRITE_INVITE` | `canWriteInvite(orgId?: string): boolean` |
| `WRITE_API_KEYS` | `canWriteApiKeys(orgId?: string): boolean` |
| `WRITE_USER_ROLES` | `canWriteUserRoles(orgId?: string): boolean` |
| `WRITE_ORGANISATIONS` | `canWriteOrganisations(orgId?: string): boolean` |
| `READ_ORGANISATIONS` | `canReadOrganisations(orgId?: string): boolean` |
| `READ_USERS` | `canReadUsers(orgId?: string): boolean` |
| `WRITE_USERS` | `canWriteUsers(orgId?: string): boolean` |
| `WRITE_USER_PASSWORDS` | `canWriteUserPasswords(orgId?: string): boolean` |
| `VIEW_BILLING` | `canViewBilling(orgId?: string): boolean` |
| `WRITE_BILLING` | `canWriteBilling(orgId?: string): boolean` |

## Technical Implementation

The type system uses TypeScript's template literal types and mapped types:

```typescript
// Convert SNAKE_CASE to PascalCase
type SnakeToPascal<S extends string> = 
  S extends `${infer First}_${infer Rest}`
    ? `${Capitalize<Lowercase<First>>}${SnakeToPascal<Rest>}`
    : Capitalize<Lowercase<S>>;

// Map all enum keys to methods with "can" prefix
type PermissionMethods = {
  [K in keyof typeof Permissions as `can${SnakeToPascal<K & string>}`]: 
    (orgId?: string) => boolean;
};

// Enforce the type on the class
export class ServerPermissions implements PermissionMethods {
  // TypeScript ensures all methods are present
}
```

## Notes

- Each method follows the same signature: `(orgId?: string): boolean`
- Each method should call `this.hasPermission(Permissions.X, orgId)`
- The `orgId` parameter is optional and defaults to the user's active organization
- This pattern ensures consistency across all permission checks

