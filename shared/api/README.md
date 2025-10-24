# API Higher-Order Functions (HOFs) Guide

This guide explains how to use the HOFs (Higher-Order Functions) for building type-safe, validated, and authenticated API routes in Next.js 16.

## Table of Contents

- [Quick Start](#quick-start)
- [Available HOFs](#available-hofs)
- [Usage Examples](#usage-examples)
- [Composition](#composition)
- [Response Helpers](#response-helpers)
- [Best Practices](#best-practices)

## Quick Start

```typescript
import { withAuth, withDb, withValidation, successResponse } from "@/shared/api";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const POST = withAuth(
  withDb(
    withValidation(createUserSchema, async (req, ctx, { auth, body }) => {
      // auth.userId, auth.activeOrgId, auth.user are available
      // body is fully typed and validated
      // Database is guaranteed to be connected

      const user = await UserService.create(auth.userId, body, auth.activeOrgId);
      return successResponse({ user }, 201);
    })
  )
);
```

## Available HOFs

### `withAuth`

Handles authentication and authorization using PropelAuth.

**Features:**
- Validates authentication tokens
- Extracts user and organization info
- Supports role-based access control (RBAC)
- Supports permission-based access control

**Type:** Transforms `CoreHandler` → `NextRouteHandler`

**Usage:**

```typescript
import { withAuth } from "@/shared/api";

// Simple authentication
export const GET = withAuth(async (req, ctx, { auth }) => {
  return successResponse({
    userId: auth.userId,
    orgId: auth.activeOrgId,
    role: auth.role,
  });
});

// With permission requirements
export const POST = withAuth(
  async (req, ctx, { auth }) => {
    return successResponse({ message: "Authorized" });
  },
  {
    requiredRoles: ["Admin"],
    requiredPermissions: ["users:write"],
  }
);

// With custom permission check
export const DELETE = withAuth(
  async (req, ctx, { auth }) => {
    return successResponse({ message: "Authorized" });
  },
  {
    customCheck: (authProps) => {
      return authProps.role === "Admin" || authProps.userId === "special-user-id";
    },
  }
);
```

**Auth Props:**

```typescript
type WithAuthProps = {
  user: any; // PropelAuth user object
  userId: string;
  activeOrgId: string;
  activeOrgName: string;
  role: string;
  name: string;
  email: string;
};
```

**Permission Config:**

```typescript
type PermissionConfig = {
  requiredPermissions?: string[]; // All must be present
  anyPermissions?: string[]; // At least one must be present
  allPermissions?: string[]; // All must be present
  requiredRoles?: string[]; // All must match
  anyRoles?: string[]; // At least one must match
  customCheck?: (auth: WithAuthProps) => boolean;
};
```

### `withDb`

Ensures database connection before handler execution.

**Features:**
- Automatically connects to MongoDB
- Adds database metadata to props
- Enhances errors with connection context

**Type:** Wraps `CoreHandler<P, TProps>` → `CoreHandler<P, TProps>`

**Usage:**

```typescript
import { withAuth, withDb } from "@/shared/api";

export const GET = withAuth(
  withDb(async (req, ctx, { auth }) => {
    // Database is guaranteed to be connected
    const users = await UserModel.find({ org_id: auth.activeOrgId });
    return successResponse({ users });
  })
);
```

### `withValidation`

Validates request body using Zod schemas.

**Features:**
- Type-safe validation
- Detailed error messages
- Automatic JSON parsing
- Field-level error reporting

**Type:** Wraps `CoreHandler<P, TProps>` → `CoreHandler<P, TProps & { body: T }>`

**Usage:**

```typescript
import { withAuth, withDb, withValidation } from "@/shared/api";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  settings: z.object({
    isPublic: z.boolean(),
    allowComments: z.boolean(),
  }),
});

export const POST = withAuth(
  withDb(
    withValidation(createProjectSchema, async (req, ctx, { auth, body }) => {
      // body is fully typed as z.infer<typeof createProjectSchema>
      const project = await ProjectService.create(auth.userId, body, auth.activeOrgId);
      return successResponse({ project }, 201);
    })
  )
);
```

### `withPatchValidation`

Validates PATCH requests with support for JSON Patch (RFC 6902).

**Features:**
- Supports JSON Patch operations
- Supports regular partial updates
- Converts JSON Patch to partial objects
- Type-safe validation

**Usage:**

```typescript
import { withAuth, withDb, withPatchValidation } from "@/shared/api";
import { z } from "zod";

const updateProjectSchema = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string(),
    settings: z.object({
      isPublic: z.boolean(),
      allowComments: z.boolean(),
    }),
  })
  .partial(); // Allow partial updates

export const PATCH = withAuth(
  withDb(
    withPatchValidation(updateProjectSchema, async (req, ctx, { auth, body }) => {
      const params = await ctx.params;
      const project = await ProjectService.updateById(params.id, auth.userId, body);
      return successResponse({ project });
    })
  )
);
```

**JSON Patch example:**

```json
[
  { "op": "replace", "path": "/name", "value": "New Project Name" },
  { "op": "replace", "path": "/settings/isPublic", "value": true },
  { "op": "remove", "path": "/description" }
]
```

## Composition

### Manual Composition

HOFs are designed to be composed together. Apply them from right to left (inner to outer):

```typescript
// Order: withAuth → withDb → withValidation → handler
export const POST = withAuth(
  withDb(
    withValidation(schema, async (req, ctx, { auth, body }) => {
      // Handler
    })
  )
);
```

### Using `compose` Helper

For cleaner syntax, use the `compose` helper:

```typescript
import { compose, withAuth, withDb, withValidation } from "@/shared/api";

export const POST = compose(withAuth, withDb, withValidation(schema))(
  async (req, ctx, { auth, body }) => {
    // Handler
  }
);
```

### Execution Order

1. **withAuth** - Validates authentication, extracts user
2. **withDb** - Ensures database connection
3. **withValidation** - Validates request body
4. **Handler** - Your business logic

## Response Helpers

Use response helpers for consistent API responses:

```typescript
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  notFoundResponse,
  createdResponse,
  noContentResponse,
} from "@/shared/api";

// Success (200)
return successResponse({ user });

// Created (201)
return createdResponse({ user });

// No Content (204)
return noContentResponse();

// Paginated (200)
return paginatedResponse(users, {
  total: 100,
  page: 1,
  page_size: 20,
  page_count: 5,
});

// Not Found (404)
return notFoundResponse("User");

// Error (custom status)
return errorResponse("Something went wrong", 500);
```

## Best Practices

### 1. **Always Use withAuth First**

`withAuth` should be the outermost HOF as it transforms the handler signature:

```typescript
// ✅ Good
export const POST = withAuth(withDb(withValidation(schema, handler)));

// ❌ Bad
export const POST = withDb(withAuth(withValidation(schema, handler)));
```

### 2. **Order Matters**

Apply HOFs in the order they should execute:

1. Authentication (`withAuth`)
2. Database (`withDb`)
3. Validation (`withValidation`)
4. Handler

### 3. **Use Specific Response Helpers**

Use specific response helpers instead of raw `NextResponse.json()`:

```typescript
// ✅ Good
return successResponse({ user });
return notFoundResponse("User");

// ❌ Avoid
return NextResponse.json({ user });
return NextResponse.json({ error: "Not found" }, { status: 404 });
```

### 4. **Validate All Inputs**

Always validate request bodies with `withValidation`:

```typescript
// ✅ Good
export const POST = withAuth(
  withDb(withValidation(schema, handler))
);

// ❌ Bad - no validation
export const POST = withAuth(
  withDb(async (req, ctx, { auth }) => {
    const body = await req.json(); // Unsafe!
    // ...
  })
);
```

### 5. **Type Safety**

Let TypeScript infer types from your Zod schemas:

```typescript
const schema = z.object({
  name: z.string(),
  email: z.string().email(),
});

// body is automatically typed as { name: string; email: string }
withValidation(schema, async (req, ctx, { auth, body }) => {
  // body.name and body.email are typed!
});
```

### 6. **Handle URL Params**

Access URL params using `await ctx.params`:

```typescript
export const GET = withAuth(async (req, ctx, { auth }) => {
  const params = await ctx.params;
  const userId = params.id; // From /api/users/[id]/route.ts

  const user = await UserService.findById(userId);
  if (!user) {
    return notFoundResponse("User");
  }

  return successResponse({ user });
});
```

### 7. **Error Handling**

Errors bubble up through the HOF chain. Use try-catch for specific error handling:

```typescript
export const POST = withAuth(
  withDb(
    withValidation(schema, async (req, ctx, { auth, body }) => {
      try {
        const user = await UserService.create(auth.userId, body, auth.activeOrgId);
        return createdResponse({ user });
      } catch (error) {
        if (error instanceof ConflictError) {
          return conflictResponse("User already exists");
        }
        throw error; // Let error handling middleware deal with it
      }
    })
  )
);
```

## Complete Examples

### Basic GET Endpoint

```typescript
import { withAuth, withDb, successResponse } from "@/shared/api";

export const GET = withAuth(
  withDb(async (req, ctx, { auth }) => {
    const params = await ctx.params;
    const user = await UserService.findById(params.id);

    if (!user) {
      return notFoundResponse("User");
    }

    return successResponse({ user });
  })
);
```

### POST with Validation

```typescript
import { withAuth, withDb, withValidation, createdResponse } from "@/shared/api";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["Admin", "User"]),
});

export const POST = withAuth(
  withDb(
    withValidation(createUserSchema, async (req, ctx, { auth, body }) => {
      const user = await UserService.create(auth.userId, body, auth.activeOrgId);
      return createdResponse({ user });
    })
  ),
  { requiredRoles: ["Admin"] } // Only admins can create users
);
```

### PATCH with Validation

```typescript
import { withAuth, withDb, withPatchValidation, successResponse } from "@/shared/api";
import { z } from "zod";

const updateUserSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
  })
  .partial();

export const PATCH = withAuth(
  withDb(
    withPatchValidation(updateUserSchema, async (req, ctx, { auth, body }) => {
      const params = await ctx.params;
      const user = await UserService.updateById(params.id, auth.userId, body);

      if (!user) {
        return notFoundResponse("User");
      }

      return successResponse({ user });
    })
  )
);
```

### DELETE Endpoint

```typescript
import { withAuth, withDb, noContentResponse, notFoundResponse } from "@/shared/api";

export const DELETE = withAuth(
  withDb(async (req, ctx, { auth }) => {
    const params = await ctx.params;
    const user = await UserService.deleteById(params.id);

    if (!user) {
      return notFoundResponse("User");
    }

    return noContentResponse();
  }),
  { requiredRoles: ["Admin"] }
);
```

### List with Pagination

```typescript
import { withAuth, withDb, paginatedResponse } from "@/shared/api";
import { UniversalQueryParser } from "@/shared/utils/query.parser";

export const GET = withAuth(
  withDb(async (req, ctx, { auth }) => {
    const searchParams = new URL(req.url).searchParams;

    // Use query parser for filtering, sorting, pagination
    const parser = new UniversalQueryParser(/* config */);
    const { filters, sort, pagination } = parser.parse(searchParams);

    const result = await UserService.findAll(filters, {
      sort,
      skip: pagination.skip,
      limit: pagination.page_size,
    });

    return paginatedResponse(result.data, result.meta);
  })
);
```

## Summary

The HOF system provides:

✅ **Type Safety** - Full TypeScript inference  
✅ **Reusability** - Compose HOFs for different endpoints  
✅ **Consistency** - Standard patterns across all routes  
✅ **Validation** - Automatic request validation  
✅ **Authentication** - Built-in auth & authorization  
✅ **Error Handling** - Consistent error responses  
✅ **Database** - Automatic connection management  

Follow the patterns in this guide to build robust, maintainable API routes!
