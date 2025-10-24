# Schema-First Type Pattern with snake_case

## Overview

This document describes the simplified schema-first architecture pattern used in the Projects module, which eliminates type duplication and ensures consistency across all layers.

## Core Principle

**Mongoose schema is the single source of truth for data structure.**

All layers (domain, API, database) use `snake_case` consistently, eliminating the need for case conversion and reducing code complexity.

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│  Mongoose Schema (infrastructure/schema.ts)             │
│  - Single source of truth                               │
│  - Defines structure with snake_case                    │
│  - Exports ProjectDocument (Mongoose type)              │
│  - Exports PROJECT_MODEL_NAME constant                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Mirrors structure
                 ↓
┌─────────────────────────────────────────────────────────┐
│  Domain Types (domain/types.ts)                         │
│  - IProject interface mirrors schema structure          │
│  - Uses snake_case (matches schema)                     │
│  - Database-agnostic (no Mongoose imports)              │
│  - Nested interfaces (IProduct, IICP, etc.)             │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Validates at runtime
                 ↓
┌─────────────────────────────────────────────────────────┐
│  Zod Schemas (api/validation.ts)                        │
│  - Runtime validation                                   │
│  - Mirrors domain structure                             │
│  - Uses snake_case (matches domain)                     │
│  - Infers TypeScript types for API contracts            │
└─────────────────────────────────────────────────────────┘
```

## Benefits

### 1. **Eliminates Type Duplication**
- **Before:** Types defined in 3 places (domain, Zod, Mongoose)
- **After:** Schema defines structure, domain mirrors it, Zod validates it

### 2. **No Case Conversion**
- **Before:** camelCase in domain → snake_case in API → snake_case in DB
- **After:** snake_case everywhere (domain, API, DB)
- **Result:** Simpler code, fewer bugs, no transformation overhead

### 3. **Type Safety Without Tight Coupling**
- Domain types are database-agnostic interfaces
- Infrastructure layer can be swapped (MongoDB → PostgreSQL)
- Services work with `IProject` (domain), not `ProjectDocument` (Mongoose)

### 4. **Simplified Factories**
```typescript
// BEFORE: Manual field mapping
protected mapRequestToEntity(request: CreateProjectInput): Partial<IProject> {
  return {
    company: request.company,
    product: { 
      value_proposition: request.product?.valueProposition // ❌ case conversion
    },
    // ... 50+ lines of mapping
  };
}

// AFTER: Direct pass-through
protected mapRequestToEntity(request: CreateProjectInput): Partial<IProject> {
  return request as Partial<IProject>; // ✅ no transformation needed
}
```

## Implementation

### 1. Mongoose Schema (Infrastructure Layer)

```typescript
// infrastructure/schema.ts
const projectDefinition = {
  company: {
    name: { type: String, required: true },
    website: { type: String, required: true },
    // ... all snake_case
  },
  product: {
    description: { type: String },
    value_proposition: { type: String }, // snake_case
  },
  // ...
};

const ProjectSchema = new Schema(projectDefinition, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  collection: "projects",
});

export type ProjectDocument = IMongooseDocument<InferSchemaType<typeof ProjectSchema>>;
export const PROJECT_MODEL_NAME = "Project";
```

**Exports:**
- ✅ `PROJECT_MODEL_NAME` - String constant (safe to import anywhere)
- ❌ `ProjectDocument` - NOT exported through barrel (infrastructure internal)

### 2. Domain Types (Domain Layer)

```typescript
// domain/types.ts
export interface IProduct {
  description?: string;
  features?: string[];
  value_proposition?: string; // ✅ snake_case matches schema
}

export interface IProject extends IEntity<DatabaseId> {
  user_id: string;
  organization_id?: string;
  company: ICompany;
  product?: IProduct;
  // ... all snake_case
}
```

**Key Points:**
- Mirrors Mongoose schema structure exactly
- Uses `snake_case` for all fields
- Database-agnostic (extends `IEntity<DatabaseId>`)
- No Mongoose imports

### 3. Zod Validation (API Layer)

```typescript
// api/validation.ts
export const CreateProjectSchema = z.object({
  company: z.object({
    name: z.string().min(1),
    website: z.string().url(),
  }),
  product: z.object({
    description: z.string().optional(),
    value_proposition: z.string().optional(), // ✅ snake_case
  }).optional(),
  // ... mirrors domain structure
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
```

**Key Points:**
- Runtime validation only
- Structure mirrors domain types
- Uses `snake_case` for all fields
- TypeScript types inferred from Zod

### 4. Response DTOs (API Layer)

```typescript
// api/response.ts
export class ProjectResponseDTO {
  static fromProject(entity: IProject): ProjectResponse {
    return {
      id: entity._id.toString(),
      company: entity.company,
      product: {
        description: entity.product?.description,
        value_proposition: entity.product?.value_proposition, // ✅ direct access
      },
      // ... no case conversion needed
    };
  }
}
```

**Key Points:**
- Direct property access (no transformation)
- 1:1 mapping between domain and API response
- Type-safe with TypeScript

### 5. Factory (Application Layer)

```typescript
// application/factory.ts
export class ProjectFactory extends BaseFactory<...> {
  protected mapRequestToEntity(
    request: Partial<CreateProjectInput>
  ): Partial<IProject> {
    // Direct pass-through since API and domain both use snake_case
    return request as Partial<IProject>;
  }
}
```

**Key Points:**
- Simplified to direct type casting
- No manual field mapping needed
- TypeScript ensures structure compatibility

### 6. Service (Application Layer)

```typescript
// application/service.ts
export class ProjectsService extends BaseService<...> {
  protected mapEntityToResponse(entity: IProject): ProjectResponse {
    return ProjectResponseDTO.fromProject(entity); // ✅ uses snake_case
  }

  async researchWebsite(websiteUrl: string): Promise<AIExtractedContext> {
    // Access properties with snake_case
    const confidence = result.object.confidence;
    const metadata = {
      status: ResearchStatus.COMPLETED,
      researched_at: new Date(), // ✅ snake_case
      confidence: result.confidence,
    };
    // ...
  }
}
```

**Key Points:**
- All property access uses `snake_case`
- No case conversion in business logic
- Works with `IProject` (domain), not `ProjectDocument` (Mongoose)

## Boundary Enforcement

### Domain Layer (domain/)
```typescript
// ✅ ALLOWED
import { IEntity, DatabaseId } from "@/shared/types/repository.types";

// ❌ FORBIDDEN
import mongoose from "mongoose";
import { ProjectDocument } from "../infrastructure/schema";
import { ProjectsService } from "../application/service";
```

### Application Layer (application/)
```typescript
// ✅ ALLOWED
import { IProject } from "../domain/types";
import { PROJECT_MODEL_NAME } from "../infrastructure/schema"; // Only the constant!
import { CreateProjectInput } from "../api/validation";

// ❌ FORBIDDEN
import { ProjectDocument } from "../infrastructure/schema"; // Mongoose type
import mongoose from "mongoose";
```

### Infrastructure Layer (infrastructure/)
```typescript
// ✅ ALLOWED
import mongoose from "mongoose";
import { CompanyStageValues } from "../domain/types"; // Enums only

// ❌ FORBIDDEN
import { ProjectsService } from "../application/service";
import { CreateProjectInput } from "../api/validation";
```

### API Layer (api/)
```typescript
// ✅ ALLOWED
import { IProject } from "../domain/types";
import { z } from "zod";

// ❌ FORBIDDEN
import { ProjectDocument } from "../infrastructure/schema";
import { ProjectsService } from "../application/service";
```

## Migration Checklist

When applying this pattern to other modules:

1. **✅ Ensure Mongoose schema uses `snake_case`** consistently
2. **✅ Update domain interfaces** to use `snake_case`
3. **✅ Update Zod schemas** to match domain `snake_case`
4. **✅ Simplify factories** - remove case conversion logic
5. **✅ Fix response DTOs** - use `snake_case` property access
6. **✅ Fix services** - use `snake_case` property access
7. **✅ Update barrel exports** - DO NOT export `ProjectDocument`
8. **✅ Verify type boundaries** - no Mongoose imports in application layer

## Comparison: Before vs After

### Before (Multiple Sources of Truth)
```typescript
// domain/types.ts
interface IProduct {
  valueProposition?: string; // camelCase
}

// infrastructure/schema.ts
const product = {
  value_proposition: { type: String } // snake_case
};

// api/response.ts
value_proposition: entity.product?.valueProposition // ❌ ERROR!
```

**Problems:**
- ❌ Property name mismatch causes runtime errors
- ❌ Manual synchronization required
- ❌ Case conversion everywhere
- ❌ Three sources of truth

### After (Single Source of Truth)
```typescript
// infrastructure/schema.ts (SOURCE OF TRUTH)
const product = {
  value_proposition: { type: String } // snake_case
};

// domain/types.ts (MIRRORS SCHEMA)
interface IProduct {
  value_proposition?: string; // snake_case
}

// api/response.ts (DIRECT ACCESS)
value_proposition: entity.product?.value_proposition // ✅ Works!
```

**Benefits:**
- ✅ Consistent naming across layers
- ✅ No case conversion needed
- ✅ Single source of truth
- ✅ Type-safe with TypeScript

## Conclusion

This schema-first pattern with `snake_case` provides:

1. **Simplicity** - No case conversion, direct property access
2. **Type Safety** - TypeScript enforces structure compatibility
3. **Maintainability** - Single source of truth, easy to update
4. **Performance** - No transformation overhead
5. **Scalability** - Easy to add fields, extend structure

**This is the recommended pattern for all modules going forward.**

