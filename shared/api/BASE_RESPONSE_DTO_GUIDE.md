# Base Response DTO Pattern

## Overview

The `BaseResponseDTO` class provides a **generic, reusable pattern** for transforming domain entities to API responses. It eliminates boilerplate code and ensures consistency across all modules.

## Key Benefits

### 1. **DRY Principle** ✅
- Define transformation logic **once** in the base class
- No more manual field-by-field mapping
- 100+ lines of boilerplate → 5-10 lines

### 2. **Type Safety** ✅
- Full TypeScript generics support
- Compiler enforces entity/response compatibility
- IDE autocomplete works perfectly

### 3. **Inheritance for Customization** ✅
- Default behavior: spreads all fields, converts `_id` → `id`
- Override `transform()` only when you need custom logic
- Call `super.transform()` to get base transformation

### 4. **Consistent API** ✅
- All modules use same methods: `fromEntity()`, `fromEntities()`
- Predictable, easy to learn
- Easy to test

## Basic Usage

### 1. Simple Module (MongoDB)

When your response shape exactly matches your domain entity:

```typescript
// modules/clients/api/response.ts
import { BaseResponseDTO } from "@/shared/api/base.response.dto";
import { IClient } from "../domain/types";
import { ClientResponse } from "./validation";

class ClientResponseDTOClass extends BaseResponseDTO<IClient, ClientResponse> {
  protected transform(entity: IClient): ClientResponse {
    // Use MongoDB helper for _id → id transformation
    return this.transformMongoEntity(entity) as ClientResponse;
  }
}

export const ClientResponseDTO = new ClientResponseDTOClass();
```

**Database-Agnostic Design:**
- MongoDB: Use `transformMongoEntity()` helper
- SQL (future): Use `transformSqlEntity()` helper
- Custom: Implement your own transformation logic

### 2. Module with Custom Transformations

When you need computed fields, field hiding, or data restructuring:

```typescript
// modules/projects/api/response.ts
import { BaseResponseDTO } from "@/shared/api/base.response.dto";
import { IProject } from "../domain/types";
import { ProjectResponse } from "./validation";

class ProjectResponseDTOClass extends BaseResponseDTO<IProject, ProjectResponse> {
  /**
   * Override transform() for custom logic
   */
  protected transform(entity: IProject): ProjectResponse {
    // Get base MongoDB transformation (_id → id)
    const baseResponse = this.transformMongoEntity(entity);
    
    return {
      ...baseResponse,
      
      // Computed fields
      display_name: `${entity.company.name} - ${entity.name}`,
      is_active: entity.status === 'active',
      progress_percentage: this.calculateProgress(entity),
      
      // Hide internal fields (security)
      internal_notes: undefined,
      raw_research_data: undefined,
      
      // Format dates as ISO strings
      created_at: entity.created_at.toISOString(),
      updated_at: entity.updated_at.toISOString(),
    } as ProjectResponse;
  }
  
  /**
   * Helper methods for computed fields
   */
  private calculateProgress(entity: IProject): number {
    // Custom logic...
    return 0;
  }
}

export const ProjectResponseDTO = new ProjectResponseDTOClass();
```

### 3. Example: Map Transformation

Transform complex types (like Map → Object) for JSON serialization:

```typescript
// modules/subscriptions/api/response.ts
class SubscriptionResponseDTOClass extends BaseResponseDTO<
  ISubscription,
  SubscriptionResponse
> {
  protected transform(entity: ISubscription): SubscriptionResponse {
    // Get base MongoDB transformation
    const baseResponse = this.transformMongoEntity(entity);

    return {
      ...baseResponse,
      // Transform Map to plain object for JSON serialization
      metadata: entity.metadata
        ? Object.fromEntries(entity.metadata)
        : undefined,
    } as SubscriptionResponse;
  }
}

export const SubscriptionResponseDTO = new SubscriptionResponseDTOClass();
```

### 4. Database-Agnostic Design

The pattern is designed to work with any database:

```typescript
// MongoDB (current)
protected transform(entity: IClient): ClientResponse {
  return this.transformMongoEntity(entity) as ClientResponse;
}

// PostgreSQL / MySQL (future migration)
protected transform(entity: IClient): ClientResponse {
  return this.transformSqlEntity(entity) as ClientResponse;
}

// Custom database or complex logic
protected transform(entity: IClient): ClientResponse {
  // You control the transformation completely
  const { _id, ...fields } = entity;
  return {
    ...fields,
    id: this.convertId(_id),
    // Add any custom logic here
  } as ClientResponse;
}
```

## Using Response DTOs

### In Services

```typescript
// modules/clients/application/service.ts
import { ClientResponseDTO } from "../api/response";

class ClientsService extends BaseService<...> {
  protected mapEntityToResponse(entity: IClient): ClientResponse {
    return ClientResponseDTO.fromEntity(entity);
  }
}
```

### In API Routes

```typescript
// app/api/clients/route.ts
import { ClientResponseDTO } from "@/modules/clients";

export async function GET(request: Request) {
  const clients = await clientsService.findAll();
  
  // Single entity
  const response = ClientResponseDTO.fromEntity(clients[0]);
  
  // Multiple entities
  const responses = ClientResponseDTO.fromEntities(clients);
  
  return successResponse(responses);
}
```

### Convenience Functions

For cleaner code, use the convenience functions:

```typescript
import { toClientResponse, toClientResponses } from "@/modules/clients";

const response = toClientResponse(client);
const responses = toClientResponses(clients);
```

## API Reference

### Base Class

```typescript
abstract class BaseResponseDTO<TEntity, TResponse> {
  // Public API
  fromEntity(entity: TEntity): TResponse
  fromEntities(entities: TEntity[]): TResponse[]
  toResponse(entity: TEntity): TResponse        // Alias
  toResponses(entities: TEntity[]): TResponse[] // Alias
  
  // Must override in subclass (database-agnostic design)
  protected abstract transform(entity: TEntity): TResponse
  
  // Helper methods
  protected convertId(id: DatabaseId): string
  protected transformMongoEntity(entity: TEntity): {...}  // MongoDB helper
  protected transformSqlEntity(entity: TEntity): {...}    // SQL helper
}
```

### Common Use Cases for Override

#### 1. Computed Fields
```typescript
protected transform(entity: IClient): ClientResponse {
  const base = super.transform(entity);
  return {
    ...base,
    full_name: `${entity.first_name} ${entity.last_name}`,
  };
}
```

#### 2. Field Hiding (Security)
```typescript
protected transform(entity: IUser): UserResponse {
  const { password_hash, internal_notes, ...safe } = entity;
  return {
    ...safe,
    id: this.convertId(entity._id),
  };
}
```

#### 3. Data Restructuring
```typescript
protected transform(entity: IClient): ClientResponse {
  const base = super.transform(entity);
  return {
    basic_info: {
      name: entity.company.name,
      website: entity.company.website,
    },
    research: {
      status: entity.research_metadata.status,
    },
  };
}
```

#### 4. Date Formatting
```typescript
protected transform(entity: IClient): ClientResponse {
  const base = super.transform(entity);
  return {
    ...base,
    created_at: entity.created_at.toISOString(),
    updated_at: entity.updated_at.toISOString(),
  };
}
```

## Architecture

### Single Source of Truth Flow

```
Zod Schema (source of truth)
    ↓
    ├─→ TypeScript Types (z.infer)
    ├─→ Mongoose Schema (generated)
    ├─→ Domain Entity (IClient)
    └─→ Response Type (ClientResponse)
            ↓
    BaseResponseDTO transforms Entity → Response
```

### Layer Responsibilities

1. **Domain Layer** (`domain/types.ts`)
   - Defines `IClient` type (inferred from Zod)
   - Database-agnostic
   - Core business types

2. **API Layer** (`api/validation.ts`)
   - Defines `ClientResponse` type (Zod schema)
   - Validation rules
   - API contracts

3. **Response DTO** (`api/response.ts`)
   - Transforms `IClient` → `ClientResponse`
   - Handles field transformations
   - Decouples internal/external structures

## Before vs After

### Before (Manual Mapping)
```typescript
// 100+ lines of boilerplate
static fromClient(entity: IClient): ClientResponse {
  return {
    id: entity._id.toString(),
    company: {
      name: entity.company.name,
      industry: entity.company.industry,
      // ... 90+ more lines
    },
  };
}
```

### After (Base Class)
```typescript
// 5-10 lines - uses helper transformation
class ClientResponseDTOClass extends BaseResponseDTO<IClient, ClientResponse> {
  protected transform(entity: IClient): ClientResponse {
    return this.transformMongoEntity(entity) as ClientResponse;
  }
}
export const ClientResponseDTO = new ClientResponseDTOClass();
```

**Key Improvement:**
- You choose the transformation strategy (MongoDB, SQL, custom)
- Database-agnostic design
- Easy to migrate between databases
- Still eliminates 90+ lines of boilerplate

## Testing

```typescript
describe('ClientResponseDTO', () => {
  it('should transform _id to id', () => {
    const entity = { _id: '123', name: 'Test' } as IClient;
    const response = ClientResponseDTO.fromEntity(entity);
    
    expect(response.id).toBe('123');
    expect(response._id).toBeUndefined();
  });
  
  it('should handle multiple entities', () => {
    const entities = [entity1, entity2] as IClient[];
    const responses = ClientResponseDTO.fromEntities(entities);
    
    expect(responses).toHaveLength(2);
    expect(responses[0].id).toBeDefined();
  });
});
```

## Migration Guide

### Step 1: Update Response DTO

Replace manual mapping with base class:

```typescript
// OLD
export class ClientResponseDTO {
  static fromClient(entity: IClient): ClientResponse {
    return { /* 100 lines of manual mapping */ };
  }
}

// NEW
class ClientResponseDTOClass extends BaseResponseDTO<IClient, ClientResponse> {}
export const ClientResponseDTO = new ClientResponseDTOClass();
```

### Step 2: Update Service

Change from static to instance method:

```typescript
// OLD
return ClientResponseDTO.fromClient(entity);

// NEW
return ClientResponseDTO.fromEntity(entity);
```

### Step 3: Update Exports

Export convenience functions:

```typescript
export {
  ClientResponseDTO,
  toClientResponse,
  toClientResponses,
} from "./api/response";
```

## Summary

✅ **Use BaseResponseDTO for all new modules**
✅ **Override `transform()` only when needed**
✅ **Default behavior handles 95% of cases**
✅ **Eliminates 100+ lines of boilerplate per module**
✅ **Type-safe, testable, maintainable**

