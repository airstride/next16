# API Utilities

Shared utilities and patterns for building consistent API routes.

## Error Handling

### Overview

The error handling system provides:
- **Consistent error structure** across all endpoints
- **Automatic error serialization** to JSON
- **Built-in logging** for debugging
- **Type-safe error classes** for common scenarios

### Error Classes

All custom errors extend `BaseError` and include:
- HTTP status code
- Error message
- Optional metadata
- Timestamp
- Automatic logging

```typescript
import {
  ValidationError,      // 400 - Input validation failures
  AuthenticationError,  // 401 - Missing/invalid authentication
  AuthorizationError,   // 403 - Insufficient permissions
  NotFoundError,        // 404 - Resource not found
  ConflictError,        // 409 - Resource conflict (duplicates)
  RateLimitError,       // 429 - Rate limit exceeded
  DatabaseError,        // 500 - Database operation failures
  ExternalServiceError, // 502 - External API failures
  ServiceUnavailableError, // 503 - Service temporarily down
} from "@/shared/utils/errors";
```

### Basic Usage

#### Throwing Errors

```typescript
// In service layer or route handler
if (!user) {
  throw new NotFoundError("User");
}

if (user.orgId !== requestedOrgId) {
  throw new AuthorizationError("Cannot access this organization");
}

if (existingEmail) {
  throw new ConflictError("Email already registered");
}
```

#### Handling Errors Automatically

Use the `withErrorHandler` HOF to catch and serialize all errors:

```typescript
// app/api/users/[id]/route.ts
import { withErrorHandler } from "@/shared/api/error.handler.hof";
import { NotFoundError } from "@/shared/utils/errors";
import { SuccessResponse } from "@/shared/api/response.helper";

export const GET = withErrorHandler(async (req, { params }) => {
  const user = await getUserById(params.id);
  
  if (!user) {
    throw new NotFoundError("User");
  }
  
  return SuccessResponse.withData(user);
});
```

#### Manual Error Handling

For custom error handling logic:

```typescript
import { ErrorHandler } from "@/shared/utils/errors";

export async function POST(req: NextRequest) {
  try {
    // Your handler logic
    return SuccessResponse.created(newId);
  } catch (error) {
    return ErrorHandler.handle(error);
  }
}
```

### Validation Errors

#### From Zod

```typescript
import { z } from "zod";
import { ValidationError } from "@/shared/utils/errors";

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
});

try {
  const data = schema.parse(input);
} catch (error) {
  throw ValidationError.fromZod(error);
}
```

#### Custom Validation

```typescript
throw new ValidationError("Invalid input", {
  errors: {
    email: ["Email is required", "Must be valid email"],
    age: ["Must be at least 18"],
  },
});
```

### Database Errors

Automatic conversion from Mongoose errors:

```typescript
import { DatabaseError } from "@/shared/utils/errors";

try {
  await User.create(data);
} catch (error) {
  throw DatabaseError.fromMongoose(error);
}
```

Handles:
- Duplicate key errors (11000) → `ConflictError`
- Validation errors → `ValidationError`
- Cast errors → `ValidationError`
- Other errors → `DatabaseError`

### External Service Errors

```typescript
import { ExternalServiceError } from "@/shared/utils/errors";

try {
  const response = await openai.chat.completions.create({...});
} catch (error) {
  throw new ExternalServiceError(
    "OpenAI",
    "Failed to generate completion",
    { model: "gpt-4", error: error.message }
  );
}
```

### Error Response Helpers

Quick response creation without throwing:

```typescript
import { ErrorResponse } from "@/shared/utils/errors";

// In route handlers
if (!isAuthorized) {
  return ErrorResponse.forbidden();
}

if (rateLimitExceeded) {
  return ErrorResponse.rateLimit("Too many requests");
}

if (!resource) {
  return ErrorResponse.notFound("Project");
}

return ErrorResponse.validation("Invalid input", {
  email: ["Required field"],
});
```

## Success Responses

### Standard Responses

```typescript
import { SuccessResponse } from "@/shared/api/response.helper";

// Return ID (create/update operations)
return SuccessResponse.withId(newUserId, 201);

// Return data
return SuccessResponse.withData(user);

// No content
return SuccessResponse.noContent();

// Created (201)
return SuccessResponse.created(id);

// Accepted (202) - async operations
return SuccessResponse.accepted("Processing started");
```

### Paginated Responses

```typescript
import { PaginatedResponse } from "@/shared/api/response.helper";

const users = await userService.findMany({ page, limit });
const total = await userService.count();

return PaginatedResponse.create(users, {
  total,
  page,
  page_size: limit,
});
```

Response structure:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "page_size": 20,
    "page_count": 5
  }
}
```

## Error Response Structure

All errors follow the `IErrorResponse` interface:

```typescript
{
  "message": "User not found",
  "details": {
    "user_id": "123",
    "searched_at": "2025-10-23T10:00:00Z"
  }
}
```

Validation errors include field-level details:
```typescript
{
  "message": "Validation failed",
  "details": {
    "errors": {
      "email": ["Email is required", "Must be valid email"],
      "age": ["Must be at least 18"]
    }
  }
}
```

## Complete Example

```typescript
// app/api/projects/route.ts
import { withErrorHandler } from "@/shared/api/error.handler.hof";
import { SuccessResponse, PaginatedResponse } from "@/shared/api/response.helper";
import { ValidationError, NotFoundError } from "@/shared/utils/errors";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1),
  website_url: z.string().url(),
});

// GET - List projects with pagination
export const GET = withErrorHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const projects = await projectService.findMany({ page, limit });
  const total = await projectService.count();

  return PaginatedResponse.create(projects, { total, page, page_size: limit });
});

// POST - Create project
export const POST = withErrorHandler(async (req) => {
  const body = await req.json();

  // Validate input
  const validationResult = createProjectSchema.safeParse(body);
  if (!validationResult.success) {
    throw ValidationError.fromZod(validationResult.error);
  }

  const data = validationResult.data;

  // Check for duplicates
  const existing = await projectService.findByWebsite(data.website_url);
  if (existing) {
    throw new ConflictError("Project with this website already exists");
  }

  // Create project
  const project = await projectService.create(data);

  return SuccessResponse.created(project.id);
});

// GET - Get single project
export const GET_BY_ID = withErrorHandler(async (req, { params }) => {
  const project = await projectService.findById(params.id);

  if (!project) {
    throw new NotFoundError("Project");
  }

  return SuccessResponse.withData(project);
});
```

## Best Practices

1. **Always use `withErrorHandler`** - Ensures consistent error handling
2. **Throw errors in services** - Let the error handler catch and serialize them
3. **Use specific error classes** - Better than generic errors
4. **Include metadata** - Helps with debugging
5. **Let HOF handle serialization** - Don't manually create error responses
6. **Use ValidationError.fromZod()** - Automatic Zod error conversion
7. **Use DatabaseError.fromMongoose()** - Automatic Mongoose error conversion

## Integration with HOFs

Error handling composes well with other HOFs:

```typescript
import { withAuth } from "@/shared/api/with-auth";
import { withDb } from "@/shared/api/with-db";
import { withValidation } from "@/shared/api/with-validation";
import { withErrorHandler } from "@/shared/api/error.handler.hof";

// All HOFs include error handling internally
export const POST = withAuth(
  withDb(
    withValidation(createProjectSchema)(
      async (req, { user, validated }) => {
        // All errors thrown here are automatically handled
        const project = await projectService.create(validated);
        return SuccessResponse.created(project.id);
      }
    )
  )
);
```

