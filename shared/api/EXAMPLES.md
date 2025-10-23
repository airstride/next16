# Error Handling Examples

Complete examples demonstrating the error handling system in real-world scenarios.

## Example 1: Basic CRUD API with Error Handling

```typescript
// app/api/projects/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withErrorHandler,
  SuccessResponse,
  PaginatedResponse,
  ValidationError,
  ConflictError,
} from "@/shared/types";

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  website_url: z.string().url("Must be a valid URL"),
  industry: z.string().optional(),
});

// GET /api/projects - List all projects with pagination
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  // Query database
  const projects = await Project.find()
    .skip((page - 1) * limit)
    .limit(limit);
  const total = await Project.countDocuments();

  // Return paginated response
  return PaginatedResponse.create(projects, {
    total,
    page,
    page_size: limit,
  });
});

// POST /api/projects - Create new project
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();

  // Validate input with Zod
  const result = createProjectSchema.safeParse(body);
  if (!result.success) {
    throw ValidationError.fromZod(result.error);
  }

  const data = result.data;

  // Check for duplicates
  const existing = await Project.findOne({ website_url: data.website_url });
  if (existing) {
    throw new ConflictError("Project with this website already exists");
  }

  // Create project
  const project = await Project.create(data);

  // Return created response (201)
  return SuccessResponse.created(project._id.toString());
});
```

## Example 2: Single Resource Endpoint

```typescript
// app/api/projects/[id]/route.ts
import { NextRequest } from "next/server";
import {
  withErrorHandler,
  SuccessResponse,
  NotFoundError,
  AuthorizationError,
} from "@/shared/types";

// GET /api/projects/:id - Get single project
export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const project = await Project.findById(params.id);

  if (!project) {
    throw new NotFoundError("Project", {
      project_id: params.id,
    });
  }

  return SuccessResponse.withData(project);
});

// PATCH /api/projects/:id - Update project
export const PATCH = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const body = await req.json();

  // Find project
  const project = await Project.findById(params.id);
  if (!project) {
    throw new NotFoundError("Project");
  }

  // Check authorization (example)
  const currentUser = await getCurrentUser(req);
  if (project.user_id !== currentUser.id) {
    throw new AuthorizationError("Cannot modify this project");
  }

  // Update project
  Object.assign(project, body);
  await project.save();

  return SuccessResponse.withId(project._id.toString());
});

// DELETE /api/projects/:id - Delete project
export const DELETE = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const project = await Project.findById(params.id);

  if (!project) {
    throw new NotFoundError("Project");
  }

  await project.deleteOne();

  return SuccessResponse.noContent();
});
```

## Example 3: Service Layer with Error Handling

```typescript
// modules/projects/service.ts
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
} from "@/shared/types";
import { z } from "zod";

export class ProjectService {
  /**
   * Create a new project
   */
  async create(data: unknown) {
    // Validate input
    const result = createProjectSchema.safeParse(data);
    if (!result.success) {
      throw ValidationError.fromZod(result.error);
    }

    const validated = result.data;

    // Check for duplicates
    const existing = await Project.findOne({
      website_url: validated.website_url,
    });

    if (existing) {
      throw new ConflictError("Project with this website already exists", {
        existing_id: existing._id.toString(),
        website_url: validated.website_url,
      });
    }

    // Create project
    try {
      const project = await Project.create(validated);
      return project;
    } catch (error) {
      throw DatabaseError.fromMongoose(error);
    }
  }

  /**
   * Find project by ID
   */
  async findById(id: string) {
    const project = await Project.findById(id);

    if (!project) {
      throw new NotFoundError("Project", {
        project_id: id,
        searched_at: new Date().toISOString(),
      });
    }

    return project;
  }

  /**
   * Research website using AI
   */
  async researchWebsite(websiteUrl: string) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Extract company information from website...",
          },
        ],
      });

      return response.choices[0].message.content;
    } catch (error: any) {
      throw new ExternalServiceError(
        "OpenAI",
        "Failed to research website",
        {
          website_url: websiteUrl,
          error_message: error.message,
          status_code: error.status,
        }
      );
    }
  }

  /**
   * Update project
   */
  async update(id: string, data: unknown) {
    // Find project
    const project = await this.findById(id); // Throws NotFoundError

    // Validate updates
    const result = updateProjectSchema.safeParse(data);
    if (!result.success) {
      throw ValidationError.fromZod(result.error);
    }

    // Apply updates
    Object.assign(project, result.data);

    try {
      await project.save();
      return project;
    } catch (error) {
      throw DatabaseError.fromMongoose(error);
    }
  }
}
```

## Example 4: With Authentication & Authorization

```typescript
// app/api/projects/[id]/route.ts
import { getUserFromAuthHeader } from "@/shared/auth/auth.service";
import {
  withErrorHandler,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  SuccessResponse,
} from "@/shared/types";

export const GET = withErrorHandler(async (req, { params }) => {
  // Get authenticated user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new AuthenticationError("Authorization header required");
  }

  const user = await getUserFromAuthHeader(authHeader);
  if (!user) {
    throw new AuthenticationError("Invalid authorization token");
  }

  // Find project
  const project = await Project.findById(params.id);
  if (!project) {
    throw new NotFoundError("Project");
  }

  // Check authorization
  const userOrgs = user.getOrgs().map((org) => org.orgId);
  if (!userOrgs.includes(project.org_id)) {
    throw new AuthorizationError(
      "You don't have access to this project",
      {
        user_id: user.userId,
        project_id: params.id,
        required_org: project.org_id,
      }
    );
  }

  return SuccessResponse.withData(project);
});
```

## Example 5: Database Operations

```typescript
// modules/projects/repository.ts
import { DatabaseError, NotFoundError } from "@/shared/types";
import { BaseRepository } from "@/shared/db/base.repository";

export class ProjectRepository extends BaseRepository<IProject> {
  /**
   * Create project with error handling
   */
  async create(data: CreateProjectInput) {
    try {
      const project = await this.model.create(data);
      return project;
    } catch (error) {
      // Automatically converts Mongoose errors
      throw DatabaseError.fromMongoose(error);
    }
  }

  /**
   * Find or throw
   */
  async findByIdOrThrow(id: string) {
    const project = await this.model.findById(id);

    if (!project) {
      throw new NotFoundError("Project", { project_id: id });
    }

    return project;
  }

  /**
   * Update with conflict detection
   */
  async updateWithVersion(id: string, data: any, expectedVersion: number) {
    try {
      const result = await this.model.findOneAndUpdate(
        { _id: id, version: expectedVersion },
        { ...data, version: expectedVersion + 1 },
        { new: true }
      );

      if (!result) {
        throw new ConflictError(
          "Project was modified by another user",
          {
            project_id: id,
            expected_version: expectedVersion,
          }
        );
      }

      return result;
    } catch (error) {
      throw DatabaseError.fromMongoose(error);
    }
  }
}
```

## Example 6: Inngest Functions with Error Handling

```typescript
// inngest/functions/project.created.ts
import { inngest } from "../client";
import {
  DatabaseError,
  ExternalServiceError,
  NotFoundError,
} from "@/shared/types";

export const projectCreatedHandler = inngest.createFunction(
  {
    id: "project-created",
    retries: 3,
  },
  { event: "project.created" },
  async ({ event, step }) => {
    const { project_id } = event.data;

    // Find project
    const project = await step.run("find-project", async () => {
      const proj = await Project.findById(project_id);
      if (!proj) {
        throw new NotFoundError("Project", { project_id });
      }
      return proj;
    });

    // Research website with AI
    const research = await step.run("research-website", async () => {
      try {
        return await aiService.researchWebsite(project.website_url);
      } catch (error: any) {
        throw new ExternalServiceError(
          "AI Research",
          "Failed to research website",
          { error: error.message }
        );
      }
    });

    // Update project with research
    await step.run("update-project", async () => {
      try {
        project.ai_research = research;
        await project.save();
      } catch (error) {
        throw DatabaseError.fromMongoose(error);
      }
    });

    return { success: true };
  }
);
```

## Example 7: Rate Limiting

```typescript
// app/api/ai/generate/route.ts
import { RateLimitError, withErrorHandler } from "@/shared/types";

// Simple in-memory rate limiter (use Redis in production)
const rateLimits = new Map<string, { count: number; reset: number }>();

export const POST = withErrorHandler(async (req) => {
  const userId = req.headers.get("x-user-id");

  // Check rate limit
  const limit = rateLimits.get(userId);
  const now = Date.now();

  if (limit) {
    if (now < limit.reset) {
      if (limit.count >= 10) {
        throw new RateLimitError(
          "AI generation limit exceeded. Try again later.",
          {
            user_id: userId,
            reset_at: new Date(limit.reset).toISOString(),
            limit: 10,
          }
        );
      }
      limit.count++;
    } else {
      rateLimits.set(userId, { count: 1, reset: now + 60000 }); // 1 min
    }
  } else {
    rateLimits.set(userId, { count: 1, reset: now + 60000 });
  }

  // Generate AI content
  const result = await aiService.generate(req.body);
  return SuccessResponse.withData(result);
});
```

## Common Response Patterns

### Success Responses

```typescript
// Created (201)
return SuccessResponse.created(newId);

// OK with data (200)
return SuccessResponse.withData({ user, projects });

// OK with ID (200)
return SuccessResponse.withId(updatedId);

// No Content (204)
return SuccessResponse.noContent();

// Accepted for async processing (202)
return SuccessResponse.accepted("Task queued for processing");
```

### Error Responses

```typescript
// Quick error responses without throwing
return ErrorResponse.notFound("User");
return ErrorResponse.forbidden("Insufficient permissions");
return ErrorResponse.validation("Invalid input", errors);
return ErrorResponse.unauthorized();
return ErrorResponse.conflict("Resource already exists");
return ErrorResponse.rateLimit("Too many requests");
```

## Testing Error Handling

```typescript
// tests/api/projects.test.ts
import { ValidationError, NotFoundError } from "@/shared/types";

describe("Project API", () => {
  it("should throw ValidationError for invalid input", async () => {
    await expect(
      projectService.create({ name: "" })
    ).rejects.toThrow(ValidationError);
  });

  it("should throw NotFoundError for non-existent project", async () => {
    await expect(
      projectService.findById("invalid-id")
    ).rejects.toThrow(NotFoundError);
  });

  it("should return 404 response", async () => {
    const response = await GET(
      new Request("http://localhost/api/projects/123"),
      { params: { id: "123" } }
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.message).toContain("not found");
  });
});
```

