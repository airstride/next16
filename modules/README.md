# Modules Directory - Modular Architecture Standard

This directory contains feature modules following a consistent, modular architecture pattern.

## Module Structure Standard

Each module should follow this structure:

```
modules/
  └── module-name/
      ├── README.md              # Module-specific documentation
      ├── index.ts               # Public API - client & server exports
      ├── server.ts              # Server-only exports (services, models)
      ├── schema.ts              # Mongoose schemas and model definitions
      ├── service.ts             # Business logic and service layer
      ├── validation.ts          # Zod validation schemas
      ├── types.ts               # TypeScript types and enums
      └── inngest.ts             # Event handlers (optional)
```

## Import Standards

### ✅ Correct Usage

**API Routes (Server-Side):**
```typescript
// Import services from server.ts
import { projectsService } from "@/modules/projects/server";

// Import validation schemas from index.ts
import { CreateProjectSchema } from "@/modules/projects";
```

**Client Components:**
```typescript
// Import validation schemas and types from index.ts
import { CreateProjectSchema, type ProjectResponse } from "@/modules/projects";

// ❌ NEVER import from server.ts in client code
```

### ❌ Incorrect Usage

```typescript
// ❌ Don't import directly from internal files
import { projectsService } from "@/modules/projects/service";
import { CreateProjectSchema } from "@/modules/projects/validation";

// ❌ Don't import server exports in client code
import { projectsService } from "@/modules/projects/server"; // Client code
```

## File Responsibilities

### `index.ts` - Public API (Client & Server)
- Validation schemas (Zod)
- TypeScript types and interfaces
- Enums and constants
- Response types

**Purpose:** Exports that can be safely used on both client and server.

### `server.ts` - Server-Only API
- Service instances
- Model names and types
- Database-related exports

**Purpose:** Exports that should ONLY be used in server-side code (API routes, server components, Inngest functions).

### `schema.ts` - Database Schema
- Mongoose schema definitions
- Model registration
- Database entity interfaces
- Model constants

**Purpose:** Define database structure. Not directly imported by API routes.

### `service.ts` - Business Logic
- Service class implementation
- Business logic methods
- Data transformation
- External API calls

**Purpose:** Encapsulate business logic. Exported via `server.ts`.

### `validation.ts` - Validation Schemas
- Zod schemas for input validation
- Request/Response type definitions
- Validation helpers

**Purpose:** Define API contracts. Exported via `index.ts`.

### `types.ts` - Shared Types
- Enums
- Union types
- Shared constants
- Type aliases

**Purpose:** Types used across the module. Exported via `index.ts`.

### `inngest.ts` - Event Handlers (Optional)
- Inngest function definitions
- Event listeners
- Background job handlers

**Purpose:** Handle asynchronous events and workflows.

## Benefits of This Pattern

1. **Clear Boundaries:** Obvious separation between client-safe and server-only code
2. **Import Safety:** TypeScript will catch if you import server code in client components
3. **Encapsulation:** Internal implementation details stay private
4. **Refactorability:** Change internal structure without affecting consumers
5. **Consistency:** Every module follows the same pattern
6. **Discoverability:** Developers know exactly where to import from

## Creating a New Module

1. Create the module directory: `modules/your-module/`
2. Copy the structure from an existing module (e.g., `projects`)
3. Create `index.ts` and `server.ts` barrel exports
4. Implement your schemas, services, and validation
5. Export appropriately through the barrel files
6. Document module-specific details in a README

## Example: Projects Module

```typescript
// modules/projects/index.ts
export { CreateProjectSchema, UpdateProjectSchema } from "./validation";
export type { ProjectResponse, CreateProjectInput } from "./validation";
export { CompanyStage, ResearchStatus } from "./types";

// modules/projects/server.ts
export { projectsService } from "./service";
export { PROJECT_MODEL_NAME } from "./schema";
export type { IProject } from "./schema";
```

Usage in API routes:
```typescript
import { projectsService } from "@/modules/projects/server";
import { CreateProjectSchema } from "@/modules/projects";

export const POST = withValidation(
  CreateProjectSchema,
  async (req, {}, { body }) => {
    const project = await projectsService.createProject(body);
    return NextResponse.json(project);
  }
);
```

## Checklist for New Modules

- [ ] Create module directory with clear name
- [ ] Implement `schema.ts` with Mongoose models
- [ ] Implement `validation.ts` with Zod schemas
- [ ] Implement `service.ts` extending BaseService
- [ ] Create `types.ts` for shared enums/types
- [ ] Create `index.ts` with client-safe exports
- [ ] Create `server.ts` with server-only exports
- [ ] Add module README with specific documentation
- [ ] Register model in model registry
- [ ] Create API routes using the module
- [ ] Test both client and server imports

---

**Remember:** This pattern ensures type safety, prevents client/server boundary violations, and maintains a clean, scalable architecture.

