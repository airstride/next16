# Projects Module - Architecture Documentation

## Overview

The Projects module follows **Clean Architecture** principles with strict separation of concerns through physical directory boundaries. This architecture enforces database-agnostic design, making it a perfect template for other modules.

## Directory Structure

```
modules/projects/
├── domain/                    # 🎯 Pure Business Domain
│   └── types.ts              # IProject, interfaces, enums
│
├── application/               # 💼 Business Logic
│   ├── service.ts            # ProjectsService (business operations)
│   └── factory.ts            # Data transformation
│
├── infrastructure/            # 🗄️ Database Implementation  
│   └── schema.ts             # Mongoose schema (NOT exported)
│
├── api/                       # 🌐 API Contracts
│   ├── validation.ts         # Zod schemas (request/response)
│   ├── response.ts           # DTOs (domain → API)
│   └── query.config.ts       # Query parsing configuration
│
├── index.ts                   # Barrel export (controlled public API)
└── ARCHITECTURE.md            # This file
```

## Architectural Layers

### 1. Domain Layer (`domain/`)

**Purpose:** Pure business domain - the heart of the application

**Responsibilities:**
- Define core business entities (`IProject`)
- Define domain interfaces and value objects
- Define business enums (`ResearchStatus`, `CompanyStage`)
- **NO** external dependencies

**Key File:** `domain/types.ts`

```typescript
// ✅ Database-agnostic
// ✅ Framework-agnostic
// ✅ Pure TypeScript interfaces and enums

export interface IProject extends IEntity<DatabaseId> {
  company: ICompany;
  product?: IProduct;
  // ... business domain fields
}
```

**Boundaries:**
- ✅ CAN import: `@/shared/types/repository.types` (IEntity, DatabaseId)
- ✅ CAN import: Pure TypeScript types, enums
- ❌ CANNOT import: mongoose, database types
- ❌ CANNOT import: Other layers (application, infrastructure, api)

**Who can import this:**
- Everyone! Domain is the center of architecture

---

### 2. Application Layer (`application/`)

**Purpose:** Business logic and orchestration

**Responsibilities:**
- Implement business operations (CRUD, AI research)
- Coordinate between domain, infrastructure, and external services
- Transform data between layers
- Apply business rules

**Key Files:**
- `application/service.ts` - Business logic
- `application/factory.ts` - Data transformation

```typescript
// ✅ Works with IProject (domain)
// ✅ Uses IRepository interface (database-agnostic)
// ❌ Never imports ProjectDocument (Mongoose)

export class ProjectsService extends BaseService<IProject, ...> {
  // Business logic using domain types only
}
```

**Boundaries:**
- ✅ CAN import: `../domain/types` (IProject, enums)
- ✅ CAN import: `../api/*` (validation, DTOs)
- ✅ CAN import: `@/shared/services`, `@/shared/ai-sdk`, `@/shared/utils`
- ⚠️  CAN import: `PROJECT_MODEL_NAME` constant from infrastructure (only the string!)
- ❌ CANNOT import: `ProjectDocument`, mongoose types from infrastructure
- ❌ CANNOT import: Mongoose-specific implementation details

**Who can import this:**
- API routes
- Other services
- Tests

---

### 3. Infrastructure Layer (`infrastructure/`)

**Purpose:** Database implementation details (Mongoose-specific)

**Responsibilities:**
- Define Mongoose schemas
- Create Mongoose models
- Register models with model registry
- **This is the ONLY place that knows about Mongoose**

**Key File:** `infrastructure/schema.ts`

```typescript
// ✅ Mongoose-specific
// ⚠️  Not exported through index.ts
// ⚠️  Only PROJECT_MODEL_NAME constant is public

const ProjectSchema = new Schema({ ... });
export type ProjectDocument = IMongooseDocument<...>;
```

**Boundaries:**
- ✅ CAN import: mongoose, Mongoose types
- ✅ CAN import: `../domain/types` (enums for validation)
- ✅ CAN import: `@/shared/db/base.schema.types`
- ❌ CANNOT be imported by: Services, API routes, domain
- ⚠️  CAN export: `PROJECT_MODEL_NAME` constant only

**Who can import this:**
- Repository implementations (future)
- Database migration scripts
- Infrastructure tests
- **Application layer - ONLY the `PROJECT_MODEL_NAME` constant!**

**⚠️ CRITICAL:** Services should NEVER import `ProjectDocument` or other Mongoose types!

---

### 4. API Layer (`api/`)

**Purpose:** API contracts and data transformation

**Responsibilities:**
- Define API request/response schemas (Zod)
- Transform domain entities → API responses
- Parse and validate query parameters
- Define API contracts (snake_case)

**Key Files:**
- `api/validation.ts` - Zod schemas for API contracts
- `api/response.ts` - DTOs (IProject → ProjectResponse)
- `api/query.config.ts` - Query parsing configuration

```typescript
// ✅ API contracts (snake_case)
// ✅ Works with domain types
// ❌ Never touches database

export const CreateProjectInputSchema = z.object({
  company: z.object({
    name: z.string(),
    // ... snake_case API fields
  }),
});

export class ProjectResponseDTO {
  static fromProject(entity: IProject): ProjectResponse {
    // Transform domain entity → API response
  }
}
```

**Boundaries:**
- ✅ CAN import: `../domain/types` (IProject, enums)
- ✅ CAN import: `@/shared/validation`, `@/shared/utils/query.parser`
- ✅ CAN import: `zod`
- ❌ CANNOT import: `../infrastructure/schema` (database)
- ❌ CANNOT import: `../application/*` (services, factories)

**Who can import this:**
- API routes
- Services (for input/output types)
- Tests

---

## Data Flow

```
┌─────────────────────────────────────────────────────┐
│  API Route (Next.js)                                │
│  - Validates input with Zod                         │
│  - Calls service                                    │
│  - Returns response                                 │
└──────────────────┬──────────────────────────────────┘
                   │ CreateProjectInput
                   ↓
┌─────────────────────────────────────────────────────┐
│  Application Layer                                   │
│  - ProjectsService.createProject()                  │
│  - Business logic                                   │
│  - Works with IProject (domain)                     │
└──────────────────┬──────────────────────────────────┘
                   │ Partial<IProject>
                   ↓
┌─────────────────────────────────────────────────────┐
│  Repository (BaseService → MongooseRepository)      │
│  - IRepository interface (database-agnostic)        │
│  - Converts IProject ↔ ProjectDocument             │
│  - MongoDB operations                               │
└──────────────────┬──────────────────────────────────┘
                   │ ProjectDocument
                   ↓
┌─────────────────────────────────────────────────────┐
│  Infrastructure Layer                                │
│  - Mongoose schema                                  │
│  - MongoDB database                                 │
└─────────────────────────────────────────────────────┘
```

## Import Rules by Layer

### Domain Layer
```typescript
// ✅ ALLOWED
import { IEntity, DatabaseId } from "@/shared/types/repository.types";

// ❌ FORBIDDEN
import mongoose from "mongoose";
import { ProjectsService } from "../application/service";
import { ProjectDocument } from "../infrastructure/schema";
```

### Application Layer
```typescript
// ✅ ALLOWED
import { IProject, ResearchStatus } from "../domain/types";
import { PROJECT_MODEL_NAME } from "../infrastructure/schema"; // ⚠️ Constant only!
import { CreateProjectInput } from "../api/validation";

// ❌ FORBIDDEN
import { ProjectDocument } from "../infrastructure/schema";
import mongoose from "mongoose";
```

### Infrastructure Layer
```typescript
// ✅ ALLOWED
import mongoose from "mongoose";
import { CompanyStageValues } from "../domain/types"; // Enums only

// ❌ FORBIDDEN
import { ProjectsService } from "../application/service";
import { CreateProjectInput } from "../api/validation";
```

### API Layer
```typescript
// ✅ ALLOWED
import { IProject } from "../domain/types";
import { z } from "zod";

// ❌ FORBIDDEN
import { ProjectDocument } from "../infrastructure/schema";
import { ProjectsService } from "../application/service";
```

## Usage Examples

### Creating a New API Route

```typescript
// app/api/projects/route.ts

import {
  projectsService,           // ✅ Service
  CreateProjectInputSchema,  // ✅ Validation
  ProjectResponse,           // ✅ Type
} from "@/modules/projects";

export const POST = withAuth(
  withDb(
    withValidation(CreateProjectInputSchema, async (req, context) => {
      const project = await projectsService.createProject(
        context.validatedData,
        context.auth.userId,
        context.auth.orgId
      );
      
      return SuccessResponse(project);
    })
  )
);
```

### Using in Another Service

```typescript
// modules/campaigns/service.ts

import {
  IProject,              // ✅ Domain type
  projectsService,       // ✅ Service
  ResearchStatus,        // ✅ Enum
} from "@/modules/projects";

export class CampaignsService {
  async createCampaign(projectId: string) {
    const project = await projectsService.getProjectContext(projectId);
    // Use project data...
  }
}
```

### Testing

```typescript
// modules/projects/application/service.test.ts

import {
  IProject,              // ✅ Domain type for mocks
  ProjectsService,       // ✅ Service class
  ResearchStatus,        // ✅ Enums
} from "@/modules/projects";

describe("ProjectsService", () => {
  it("creates project", async () => {
    const mockProject: IProject = {
      _id: "123",
      company: { name: "Test", website: "https://test.com" },
      // ...
    };
    
    // Test with domain types
  });
});
```

## Benefits of This Architecture

### 1. Database Agnostic ✅
- Services work with `IProject` (domain), not `ProjectDocument` (Mongoose)
- Can swap MongoDB → PostgreSQL by only changing `infrastructure/`
- Business logic has ZERO database dependencies

### 2. Clear Boundaries ✅
- Physical directories enforce logical boundaries
- Barrel export makes public API obvious
- Easy to see what's internal vs. public
- TypeScript compiler enforces boundaries at compile-time

### 3. Testability ✅
- Mock `IRepository` interface
- Test services without database
- Fast unit tests
- Domain types are easy to mock

### 4. Maintainability ✅
- Each layer has single responsibility
- Changes are isolated
- Easy to understand dependencies
- Self-documenting structure

### 5. Scalability ✅
- Can extract to microservices easily
- Domain types are portable
- Infrastructure can vary per service
- Independent deployment possible

### 6. Type Safety ✅
- Compile-time checks
- IDE autocompletion works perfectly
- Refactoring is safe
- No runtime type errors

## Comparison: Before vs. After

### Before (Flat Structure)
```
modules/projects/
├── types.ts              # Mixed domain & DB types
├── schema.ts             # Mongoose + IProject mixed
├── service.ts            # Imports from schema.ts ❌
├── factory.ts            # Imports ProjectDocument ❌
├── validation.ts         # Mixed with domain
└── response.ts           # Unclear dependencies
```

**Problems:**
- ❌ Services depend on Mongoose
- ❌ No clear boundaries
- ❌ Can't swap databases
- ❌ Hard to test
- ❌ Unclear dependencies

### After (Layered Structure)
```
modules/projects/
├── domain/               # Pure domain ✅
│   └── types.ts
├── application/          # Business logic ✅
│   ├── service.ts
│   └── factory.ts
├── infrastructure/       # Database (isolated) ✅
│   └── schema.ts
├── api/                  # API contracts ✅
│   ├── validation.ts
│   ├── response.ts
│   └── query.config.ts
└── index.ts              # Controlled exports ✅
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Database-agnostic services
- ✅ Easy to test
- ✅ Can swap databases
- ✅ Self-documenting
- ✅ TypeScript enforces boundaries

## Migration Guide for Other Modules

To apply this architecture to other modules:

1. **Create directory structure:**
```bash
mkdir modules/{module}/domain
mkdir modules/{module}/application
mkdir modules/{module}/infrastructure
mkdir modules/{module}/api
```

2. **Move files:**
- Domain types → `domain/types.ts`
- Service & factory → `application/`
- Schema & Mongoose → `infrastructure/schema.ts`
- Validation & DTOs → `api/`

3. **Update imports:**
- Services: import from `../domain/types`, NOT `../infrastructure/schema`
- Use `IEntity` interface, NOT `ProjectDocument`
- Import through `index.ts` only

4. **Create barrel export:**
- Copy `index.ts` template
- Export domain, application, and API layers
- DO NOT export infrastructure internals

5. **Add documentation:**
- Copy this `ARCHITECTURE.md`
- Update module-specific details

## Enforcement

### TypeScript Configuration

Use path aliases to enforce boundaries:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/modules/projects": ["./modules/projects/index.ts"],
      "@/modules/projects/*": ["./modules/projects/*"]
    }
  }
}
```

### ESLint Rules (Future)

```javascript
// .eslintrc.js
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["**/infrastructure/**"],
            "message": "Don't import from infrastructure layer directly"
          }
        ]
      }
    ]
  }
}
```

## Conclusion

This architecture provides:
- **Clean separation of concerns**
- **Database independence**
- **Easy testing**
- **Clear boundaries**
- **Scalability**
- **Type safety**

It serves as a **perfect template** for all other modules in the project.

**Remember:** Services work with `IProject` (domain), never `ProjectDocument` (infrastructure)!

