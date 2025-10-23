# Error Handling Integration Example

This guide shows how to integrate the error handling system into your existing codebase.

## Before & After Comparison

### Before (Manual Error Handling)

```typescript
// app/api/projects/[id]/route.ts
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await Project.findById(params.id);
    
    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(project), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching project:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

### After (With Error Handling System)

```typescript
// app/api/projects/[id]/route.ts
import { withErrorHandler, NotFoundError, SuccessResponse } from "@/shared/types";

export const GET = withErrorHandler(async (req, { params }) => {
  const project = await Project.findById(params.id);
  if (!project) throw new NotFoundError("Project");
  return SuccessResponse.withData(project);
});
```

**Benefits:**
- ✅ 70% less code
- ✅ Consistent error format
- ✅ Automatic logging
- ✅ Type-safe
- ✅ Cleaner, more readable

## Full CRUD Example

```typescript
// app/api/projects/route.ts
import { NextRequest } from "next/server";
import {
  withErrorHandler,
  ValidationError,
  ConflictError,
  SuccessResponse,
  PaginatedResponse,
} from "@/shared/types";
import { z } from "zod";

// Validation schema
const createProjectSchema = z.object({
  name: z.string().min(1),
  website_url: z.string().url(),
  industry: z.string().optional(),
});

// GET /api/projects - List projects
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const projects = await Project.find()
    .skip((page - 1) * limit)
    .limit(limit);
  const total = await Project.countDocuments();

  return PaginatedResponse.create(projects, { total, page, page_size: limit });
});

// POST /api/projects - Create project
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();

  // Validate
  const result = createProjectSchema.safeParse(body);
  if (!result.success) {
    throw ValidationError.fromZod(result.error);
  }

  // Check duplicates
  const existing = await Project.findOne({ website_url: result.data.website_url });
  if (existing) {
    throw new ConflictError("Project with this website already exists");
  }

  // Create
  const project = await Project.create(result.data);
  return SuccessResponse.created(project._id.toString());
});
```

```typescript
// app/api/projects/[id]/route.ts
import {
  withErrorHandler,
  NotFoundError,
  AuthorizationError,
  SuccessResponse,
} from "@/shared/types";

// GET /api/projects/:id
export const GET = withErrorHandler(async (req, { params }) => {
  const project = await Project.findById(params.id);
  if (!project) throw new NotFoundError("Project");
  return SuccessResponse.withData(project);
});

// PATCH /api/projects/:id
export const PATCH = withErrorHandler(async (req, { params }) => {
  const project = await Project.findById(params.id);
  if (!project) throw new NotFoundError("Project");

  // Authorization check
  const user = await getCurrentUser(req);
  if (project.user_id !== user.id) {
    throw new AuthorizationError("Cannot modify this project");
  }

  const body = await req.json();
  Object.assign(project, body);
  await project.save();

  return SuccessResponse.withId(project._id.toString());
});

// DELETE /api/projects/:id
export const DELETE = withErrorHandler(async (req, { params }) => {
  const project = await Project.findById(params.id);
  if (!project) throw new NotFoundError("Project");

  await project.deleteOne();
  return SuccessResponse.noContent();
});
```

## Service Layer Example

```typescript
// modules/projects/service.ts
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
} from "@/shared/types";
import { BaseService } from "@/shared/services/base.service";
import { createProjectSchema } from "./validation";

export class ProjectService extends BaseService<IProject> {
  /**
   * Create project with AI research
   */
  async createWithResearch(websiteUrl: string, userId: string) {
    // Research website
    const research = await this.researchWebsite(websiteUrl);

    // Create project
    const data = {
      ...research,
      user_id: userId,
      website_url: websiteUrl,
    };

    return this.create(data);
  }

  /**
   * Research website using AI
   */
  private async researchWebsite(websiteUrl: string) {
    try {
      const response = await aiService.researchWebsite(websiteUrl);
      return response;
    } catch (error: any) {
      throw new ExternalServiceError(
        "AI Research",
        "Failed to research website",
        {
          website_url: websiteUrl,
          error: error.message,
        }
      );
    }
  }

  /**
   * Create project
   */
  async create(data: unknown) {
    // Validate
    const result = createProjectSchema.safeParse(data);
    if (!result.success) {
      throw ValidationError.fromZod(result.error);
    }

    // Check duplicates
    const existing = await this.repository.findOne({
      website_url: result.data.website_url,
    });
    if (existing) {
      throw new ConflictError("Project already exists");
    }

    // Create
    try {
      return await this.repository.create(result.data);
    } catch (error) {
      throw DatabaseError.fromMongoose(error);
    }
  }

  /**
   * Find by ID or throw
   */
  async findByIdOrThrow(id: string) {
    const project = await this.repository.findById(id);
    if (!project) {
      throw new NotFoundError("Project", { project_id: id });
    }
    return project;
  }

  /**
   * Update project
   */
  async update(id: string, updates: unknown) {
    const project = await this.findByIdOrThrow(id);

    // Validate updates
    const result = updateProjectSchema.safeParse(updates);
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

## Inngest Function Example

```typescript
// inngest/functions/project.created.ts
import { inngest } from "../client";
import {
  NotFoundError,
  ExternalServiceError,
  DatabaseError,
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

    // Research with AI
    const research = await step.run("ai-research", async () => {
      try {
        return await aiService.researchWebsite(project.website_url);
      } catch (error: any) {
        throw new ExternalServiceError(
          "AI Research",
          "Failed to research",
          { error: error.message }
        );
      }
    });

    // Update project
    await step.run("update-project", async () => {
      project.ai_research = research;
      try {
        await project.save();
      } catch (error) {
        throw DatabaseError.fromMongoose(error);
      }
    });

    return { success: true };
  }
);
```

## Migration Checklist

### Step 1: Update Imports

```typescript
// Old
import { NextRequest } from "next/server";

// New
import { NextRequest } from "next/server";
import {
  withErrorHandler,
  NotFoundError,
  ValidationError,
  SuccessResponse,
} from "@/shared/types";
```

### Step 2: Wrap Route Handlers

```typescript
// Old
export async function GET(req: NextRequest) {
  try {
    // handler logic
  } catch (error) {
    // manual error handling
  }
}

// New
export const GET = withErrorHandler(async (req) => {
  // handler logic - just throw errors
});
```

### Step 3: Replace Manual Error Responses

```typescript
// Old
if (!user) {
  return new Response(
    JSON.stringify({ error: "User not found" }),
    { status: 404 }
  );
}

// New
if (!user) throw new NotFoundError("User");
```

### Step 4: Update Zod Validation

```typescript
// Old
const result = schema.safeParse(data);
if (!result.success) {
  const errors = result.error.errors.map(e => e.message);
  return new Response(JSON.stringify({ errors }), { status: 400 });
}

// New
const result = schema.safeParse(data);
if (!result.success) {
  throw ValidationError.fromZod(result.error);
}
```

### Step 5: Update Success Responses

```typescript
// Old
return new Response(JSON.stringify({ id: newId }), {
  status: 201,
  headers: { "Content-Type": "application/json" },
});

// New
return SuccessResponse.created(newId);
```

## Testing

```typescript
// tests/api/projects.test.ts
import { NotFoundError, ValidationError } from "@/shared/types";

describe("Project API", () => {
  it("should return 404 for non-existent project", async () => {
    const response = await GET(
      new Request("http://localhost/api/projects/invalid-id"),
      { params: { id: "invalid-id" } }
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({
      message: "Project not found",
      details: expect.any(Object),
    });
  });

  it("should return validation error", async () => {
    const response = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe("Validation failed");
    expect(body.details.errors).toBeDefined();
  });
});
```

## Summary

**What you get:**
- ✅ Consistent error structure
- ✅ 70% less boilerplate code
- ✅ Automatic logging
- ✅ Type safety
- ✅ Better debugging
- ✅ Production-ready

**Where to use:**
- ✅ API routes (Next.js)
- ✅ Service layer
- ✅ Repository layer
- ✅ Inngest functions
- ✅ Validation
- ✅ Database operations

**What's included:**
- ✅ 9 error classes
- ✅ Automatic conversions (Zod, Mongoose)
- ✅ Response helpers
- ✅ HOF for routes
- ✅ Comprehensive documentation
- ✅ Real-world examples

