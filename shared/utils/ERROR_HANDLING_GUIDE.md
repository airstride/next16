# Error Handling Quick Reference

## Error Classes

| Error Class | Status | Use Case |
|------------|--------|----------|
| `ValidationError` | 400 | Input validation failures (Zod, request validation) |
| `AuthenticationError` | 401 | Missing or invalid authentication |
| `AuthorizationError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource doesn't exist |
| `ConflictError` | 409 | Duplicate resources, state conflicts |
| `RateLimitError` | 429 | Rate limit exceeded |
| `DatabaseError` | 500 | Database operation failures |
| `ExternalServiceError` | 502 | External API/service failures |
| `ServiceUnavailableError` | 503 | Service temporarily unavailable |

## Common Patterns

### 1. Simple Route Handler

```typescript
import { withErrorHandler } from "@/shared/api/error.handler.hof";
import { NotFoundError } from "@/shared/utils/errors";
import { SuccessResponse } from "@/shared/api/response.helper";

export const GET = withErrorHandler(async (req, { params }) => {
  const user = await getUser(params.id);
  if (!user) throw new NotFoundError("User");
  return SuccessResponse.withData(user);
});
```

### 2. Validation with Zod

```typescript
import { ValidationError } from "@/shared/utils/errors";

const result = schema.safeParse(data);
if (!result.success) {
  throw ValidationError.fromZod(result.error);
}
```

### 3. Database Operations

```typescript
import { DatabaseError } from "@/shared/utils/errors";

try {
  await Model.create(data);
} catch (error) {
  throw DatabaseError.fromMongoose(error);
}
```

### 4. External Service Calls

```typescript
import { ExternalServiceError } from "@/shared/utils/errors";

try {
  await openai.chat.completions.create({...});
} catch (error) {
  throw new ExternalServiceError("OpenAI", "Failed to generate", { error });
}
```

### 5. Authorization Check

```typescript
import { AuthorizationError } from "@/shared/utils/errors";

if (user.orgId !== resource.orgId) {
  throw new AuthorizationError("Cannot access this resource");
}
```

### 6. Duplicate Check

```typescript
import { ConflictError } from "@/shared/utils/errors";

if (await exists(email)) {
  throw new ConflictError("Email already registered");
}
```

## Error Response Format

All errors serialize to consistent JSON:

```json
{
  "message": "Error description",
  "details": {
    "key": "value"
  }
}
```

Validation errors include field-level details:

```json
{
  "message": "Validation failed",
  "details": {
    "errors": {
      "email": ["Email is required"],
      "age": ["Must be at least 18"]
    }
  }
}
```

## Quick Responses

```typescript
import { ErrorResponse } from "@/shared/utils/errors";

// Without throwing (for early returns)
return ErrorResponse.forbidden();
return ErrorResponse.notFound("Project");
return ErrorResponse.validation("Invalid input", errors);
return ErrorResponse.rateLimit();
```

## Metadata

Include debugging context:

```typescript
throw new NotFoundError("User", {
  user_id: userId,
  searched_by: currentUser.id,
  timestamp: new Date().toISOString(),
});
```

## Service Layer Pattern

```typescript
class ProjectService {
  async create(data: CreateProjectInput) {
    // Validate
    const result = createProjectSchema.safeParse(data);
    if (!result.success) {
      throw ValidationError.fromZod(result.error);
    }

    // Check duplicates
    if (await this.exists(data.website_url)) {
      throw new ConflictError("Project already exists");
    }

    // Create
    try {
      return await Project.create(result.data);
    } catch (error) {
      throw DatabaseError.fromMongoose(error);
    }
  }

  async findById(id: string) {
    const project = await Project.findById(id);
    if (!project) {
      throw new NotFoundError("Project", { project_id: id });
    }
    return project;
  }
}
```

## Remember

- ✅ Always use `withErrorHandler` HOF
- ✅ Throw errors, don't return them
- ✅ Use specific error classes
- ✅ Include metadata for debugging
- ✅ Let automatic handlers serialize errors
- ✅ Use `.fromZod()` and `.fromMongoose()` helpers

