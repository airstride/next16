# Factory Pattern Template Guide

This guide explains how to use the `factory.ts` file as a reference template for implementing factory patterns in other modules.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Key Components](#key-components)
4. [Implementation Steps](#implementation-steps)
5. [Generic Utilities](#generic-utilities)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)
8. [Examples](#examples)

---

## Overview

The Factory Pattern provides a clean, maintainable way to transform data between different representations in your application. The Projects module factory serves as a reference implementation demonstrating:

- ✅ **Type-safe transformations** without `as any` casts
- ✅ **Reusable mapping utilities** for common operations
- ✅ **Clean separation** of mapping vs business logic
- ✅ **Template Method pattern** for consistent entity creation
- ✅ **Specialized methods** for complex scenarios
- ✅ **Comprehensive documentation** with template notes

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BaseFactory                          │
│  (Abstract base class from shared/db/base.factory.ts)  │
└────────────────────┬────────────────────────────────────┘
                     │ extends
                     │
┌────────────────────▼────────────────────────────────────┐
│              ModuleFactory                              │
│  - implements mapRequestToEntity()                      │
│  - overrides applyCreateBusinessLogic()                 │
│  - adds specialized factory methods                     │
│  - includes generic mapping utilities                   │
└─────────────────────────────────────────────────────────┘
```

**Data Flow:**
```
API Request (JSON/snake_case)
    ↓
[Factory transforms]
    ↓
MongoDB Entity (schema format)
    ↓
[Service saves]
    ↓
MongoDB Document
    ↓
[Factory transforms]
    ↓
API Response (JSON/snake_case)
```

---

## Key Components

### 1. Type Definitions

Define helper types for clean, type-safe transformations:

```typescript
/**
 * Type-safe field mapping configuration
 * Maps API field names to MongoDB field names
 */
type FieldMapping<TSource, TTarget> = {
  [K in keyof TSource]?: keyof TTarget | ((value: TSource[K]) => any);
};

/**
 * Deep partial type for nested objects
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

**When to use:**
- `FieldMapping`: When you need to map fields between different naming conventions
- `DeepPartial`: When working with partial updates to nested objects

---

### 2. Generic Mapping Utilities

Three core utilities for data transformation:

#### `mapFields<TSource, TTarget>()`

Maps fields from source to target object based on configuration.

```typescript
function mapFields<TSource extends object, TTarget extends object>(
  source: TSource | undefined,
  mapping: FieldMapping<TSource, TTarget>
): Partial<TTarget>
```

**Use when:**
- Converting between snake_case ↔ camelCase
- Renaming fields
- Applying transformations during mapping

**Example:**
```typescript
const mapped = mapFields(apiRequest.user_data, {
  first_name: 'firstName',
  last_name: 'lastName',
  email_address: 'email'
});
```

#### `deepMerge<T>()`

Recursively merges two objects, with source taking precedence.

```typescript
function deepMerge<T extends object>(
  target: T,
  source: DeepPartial<T>
): T
```

**Use when:**
- Merging partial updates with existing data
- Combining nested objects
- Applying refinements to AI-generated content

**Example:**
```typescript
const merged = deepMerge(existingUser.profile, updates.profile);
```

#### `mapArray<TSource, TTarget>()`

Maps an array of objects using a mapping configuration.

```typescript
function mapArray<TSource extends object, TTarget extends object>(
  items: TSource[] | undefined,
  mapping: FieldMapping<TSource, TTarget>
): TTarget[]
```

**Use when:**
- Transforming arrays of nested objects
- Bulk data transformations

**Example:**
```typescript
const mappedCampaigns = mapArray(request.campaigns, {
  start_date: 'startDate',
  end_date: 'endDate'
});
```

---

### 3. Factory Class Structure

```typescript
export class YourModuleFactory extends BaseFactory<
  DocumentType,      // Your Mongoose document type
  CreateInputType,   // Zod validated creation input
  UpdateInputType    // Zod validated update input
> {
  // REQUIRED: Map request to entity
  protected mapRequestToEntity(
    request: Partial<CreateInputType> | UpdateInputType
  ): Partial<DocumentType> {
    // Transform API data to MongoDB entity
  }

  // OPTIONAL: Add creation business logic
  protected applyCreateBusinessLogic(
    request: CreateInputType,
    userId: string,
    orgId: string
  ): Partial<DocumentType> {
    // Add creation-specific logic
  }

  // OPTIONAL: Add update business logic
  protected applyUpdateBusinessLogic(
    request: UpdateInputType,
    userId: string
  ): Partial<DocumentType> {
    // Add update-specific logic
  }

  // OPTIONAL: Add specialized methods
  public customTransformMethod(...): Partial<DocumentType> {
    // Handle special cases
  }
}
```

---

## Implementation Steps

### Step 1: Define Your Types

```typescript
import { BaseFactory } from "@/shared/db/base.factory";
import { YourDocument } from "./schema";
import { CreateYourInput, UpdateYourInput } from "./validation";
```

### Step 2: Create the Factory Class

```typescript
export class YourModuleFactory extends BaseFactory<
  YourDocument,
  CreateYourInput,
  UpdateYourInput
> {
  // Implementation here
}
```

### Step 3: Implement mapRequestToEntity()

**Option A: Direct Pass-Through (if API and DB use same format)**

```typescript
protected mapRequestToEntity(
  request: Partial<CreateYourInput> | UpdateYourInput
): Partial<YourDocument> {
  const mapped: Partial<YourDocument> = {};

  // List fields that pass through directly
  const directFields = [
    "name",
    "description",
    "settings",
    // ... more fields
  ] as const;

  for (const field of directFields) {
    if (request[field] !== undefined) {
      (mapped as any)[field] = request[field];
    }
  }

  return mapped;
}
```

**Option B: With Transformations (if formats differ)**

```typescript
protected mapRequestToEntity(
  request: Partial<CreateYourInput> | UpdateYourInput
): Partial<YourDocument> {
  const mapped: Partial<YourDocument> = {};

  // Transform nested objects
  if (request.user_profile) {
    mapped.userProfile = {
      firstName: request.user_profile.first_name,
      lastName: request.user_profile.last_name,
      email: request.user_profile.email
    };
  }

  // Transform arrays
  if (request.tags) {
    mapped.tags = request.tags.map(tag => tag.toLowerCase());
  }

  return mapped;
}
```

### Step 4: Add Business Logic (Optional)

```typescript
protected applyCreateBusinessLogic(
  request: CreateYourInput,
  userId: string,
  orgId: string
): Partial<YourDocument> {
  return {
    status: 'active',
    createdBy: userId,
    organizationId: orgId,
    // ... other default values
  };
}
```

### Step 5: Add Specialized Methods (Optional)

```typescript
/**
 * Create entity from external API data
 */
createFromExternalAPI(
  externalData: ExternalAPIData,
  userId: string
): Partial<YourDocument> {
  return {
    // Map external data structure to your entity
    name: externalData.title,
    description: externalData.description,
    externalId: externalData.id,
    userId
  };
}
```

### Step 6: Export Singleton

```typescript
export const yourModuleFactory = new YourModuleFactory();
```

---

## Generic Utilities

### When to Use Each Utility

| Utility | Use Case | Example |
|---------|----------|---------|
| `mapFields()` | Field renaming/transformation | snake_case → camelCase |
| `deepMerge()` | Nested object merging | Partial updates |
| `mapArray()` | Array transformations | List of nested objects |

### Combining Utilities

```typescript
// Example: Transform and merge in one operation
const transformed = mapFields(updates, fieldMapping);
const merged = deepMerge(existing, transformed);
```

---

## Best Practices

### ✅ DO

1. **Keep Mapping Separate from Business Logic**
   ```typescript
   // ✅ Good
   protected mapRequestToEntity(request) {
     return { name: request.name }; // Just mapping
   }

   protected applyCreateBusinessLogic() {
     return { status: 'active' }; // Business logic
   }
   ```

2. **Use Type-Safe Transformations**
   ```typescript
   // ✅ Good
   const mapped: Partial<DocumentType> = {};
   mapped.field = request.field;
   ```

3. **Document Complex Transformations**
   ```typescript
   // ✅ Good
   /**
    * Converts API pagination format to MongoDB cursor format
    */
   protected mapPagination(request) { /* ... */ }
   ```

4. **Use Utilities for Repetitive Operations**
   ```typescript
   // ✅ Good
   const merged = deepMerge(existing, updates);
   ```

5. **Add Template Notes for Reusability**
   ```typescript
   /**
    * @template-note
    * For other modules: override this to add validation logic
    */
   ```

### ❌ DON'T

1. **Don't Mix Concerns**
   ```typescript
   // ❌ Bad
   protected mapRequestToEntity(request) {
     const mapped = { name: request.name };
     // Don't put business logic here!
     mapped.status = calculateStatus(request);
     return mapped;
   }
   ```

2. **Don't Use `as any` Without Good Reason**
   ```typescript
   // ❌ Bad
   return request as any;

   // ✅ Good
   return mapFields(request, fieldMapping);
   ```

3. **Don't Repeat Transformation Logic**
   ```typescript
   // ❌ Bad
   // Same transformation code in multiple places

   // ✅ Good
   // Extract to a shared utility function
   ```

4. **Don't Ignore Null Safety**
   ```typescript
   // ❌ Bad
   const value = request.nested.field; // Can throw

   // ✅ Good
   const value = request.nested?.field;
   ```

---

## Common Patterns

### Pattern 1: AI/External Data Integration

```typescript
/**
 * Create entity from AI-extracted data
 */
createFromAI(
  aiData: AIExtractedData,
  userId: string
): Partial<DocumentType> {
  return {
    // Map AI data
    ...this.mapAIData(aiData),
    // Add metadata
    aiGenerated: true,
    aiConfidence: aiData.confidence,
    userId
  };
}
```

### Pattern 2: Refinement/Merge Operations

```typescript
/**
 * Merge user refinements with existing data
 */
mergeRefinements(
  existing: DocumentType,
  refinements: RefinementInput
): Partial<DocumentType> {
  const mapped = this.mapRequestToEntity(refinements);

  const nestedFields = ['profile', 'settings'] as const;
  const result: Partial<DocumentType> = {};

  for (const field of nestedFields) {
    if (refinements[field] && existing[field]) {
      result[field] = deepMerge(existing[field], mapped[field]);
    }
  }

  return result;
}
```

### Pattern 3: Bulk Operations

```typescript
/**
 * Transform multiple items for bulk creation
 */
createBulkEntities(
  items: CreateInput[],
  userId: string,
  orgId: string
): Partial<DocumentType>[] {
  return items.map(item =>
    this.createFromRequest(item, userId, orgId)
  );
}
```

### Pattern 4: Validation Helpers

```typescript
/**
 * Validate entity data before save
 */
validateEntity(entity: Partial<DocumentType>): boolean {
  return !!(
    entity.name &&
    entity.userId &&
    entity.organizationId
  );
}
```

### Pattern 5: Confidence/Quality Metrics

```typescript
/**
 * Calculate data quality score
 */
calculateQualityScore(entity: DocumentType): number {
  let score = 0;
  if (entity.name) score += 25;
  if (entity.description) score += 25;
  if (entity.metadata) score += 25;
  if (entity.verified) score += 25;
  return score;
}
```

---

## Examples

### Example 1: Simple CRUD Factory

```typescript
import { BaseFactory } from "@/shared/db/base.factory";
import { TaskDocument } from "./schema";
import { CreateTaskInput, UpdateTaskInput } from "./validation";

export class TaskFactory extends BaseFactory<
  TaskDocument,
  CreateTaskInput,
  UpdateTaskInput
> {
  protected mapRequestToEntity(
    request: Partial<CreateTaskInput> | UpdateTaskInput
  ): Partial<TaskDocument> {
    // API and DB both use snake_case, so direct pass-through
    return {
      title: request.title,
      description: request.description,
      due_date: request.due_date,
      priority: request.priority,
      status: request.status
    };
  }

  protected applyCreateBusinessLogic(
    request: CreateTaskInput,
    userId: string,
    orgId: string
  ): Partial<TaskDocument> {
    void request;

    return {
      status: 'pending',
      created_by: userId,
      organization_id: orgId
    };
  }
}

export const taskFactory = new TaskFactory();
```

### Example 2: Complex Transformation Factory

```typescript
import { BaseFactory } from "@/shared/db/base.factory";
import { UserDocument } from "./schema";
import { CreateUserInput, UpdateUserInput } from "./validation";

export class UserFactory extends BaseFactory<
  UserDocument,
  CreateUserInput,
  UpdateUserInput
> {
  protected mapRequestToEntity(
    request: Partial<CreateUserInput> | UpdateUserInput
  ): Partial<UserDocument> {
    const mapped: Partial<UserDocument> = {};

    // Transform user profile (snake_case → camelCase)
    if (request.profile) {
      mapped.profile = {
        firstName: request.profile.first_name,
        lastName: request.profile.last_name,
        avatarUrl: request.profile.avatar_url,
        bio: request.profile.bio
      };
    }

    // Transform preferences
    if (request.preferences) {
      mapped.preferences = {
        emailNotifications: request.preferences.email_notifications,
        pushNotifications: request.preferences.push_notifications,
        theme: request.preferences.theme
      };
    }

    return mapped;
  }

  protected applyCreateBusinessLogic(
    request: CreateUserInput,
    userId: string,
    orgId: string
  ): Partial<UserDocument> {
    void request;

    return {
      status: 'active',
      role: 'user',
      email_verified: false,
      created_by: userId,
      organization_id: orgId,
      last_login: new Date()
    };
  }

  // Specialized method for OAuth users
  createFromOAuth(
    oauthData: OAuthData,
    userId: string,
    orgId: string
  ): Partial<UserDocument> {
    return {
      profile: {
        firstName: oauthData.given_name,
        lastName: oauthData.family_name,
        avatarUrl: oauthData.picture
      },
      email: oauthData.email,
      email_verified: oauthData.email_verified,
      oauth_provider: oauthData.provider,
      oauth_id: oauthData.sub,
      created_by: userId,
      organization_id: orgId
    };
  }
}

export const userFactory = new UserFactory();
```

### Example 3: Factory with Utilities

```typescript
import { BaseFactory } from "@/shared/db/base.factory";
import { AnalyticsDocument } from "./schema";
import { CreateAnalyticsInput, UpdateAnalyticsInput } from "./validation";

// Reusable mapping utility
function mapMetrics(metrics: any) {
  return {
    pageViews: metrics.page_views || 0,
    uniqueVisitors: metrics.unique_visitors || 0,
    bounceRate: metrics.bounce_rate || 0,
    avgSessionDuration: metrics.avg_session_duration || 0
  };
}

export class AnalyticsFactory extends BaseFactory<
  AnalyticsDocument,
  CreateAnalyticsInput,
  UpdateAnalyticsInput
> {
  protected mapRequestToEntity(
    request: Partial<CreateAnalyticsInput> | UpdateAnalyticsInput
  ): Partial<AnalyticsDocument> {
    const mapped: Partial<AnalyticsDocument> = {};

    // Use utility function
    if (request.metrics) {
      mapped.metrics = mapMetrics(request.metrics);
    }

    // Direct mappings
    if (request.date_range) {
      mapped.dateRange = {
        start: new Date(request.date_range.start),
        end: new Date(request.date_range.end)
      };
    }

    return mapped;
  }

  // Aggregate multiple analytics records
  aggregateAnalytics(
    records: AnalyticsDocument[]
  ): Partial<AnalyticsDocument> {
    return {
      metrics: {
        pageViews: records.reduce((sum, r) => sum + r.metrics.pageViews, 0),
        uniqueVisitors: records.reduce((sum, r) => sum + r.metrics.uniqueVisitors, 0),
        bounceRate: records.reduce((sum, r) => sum + r.metrics.bounceRate, 0) / records.length,
        avgSessionDuration: records.reduce((sum, r) => sum + r.metrics.avgSessionDuration, 0) / records.length
      }
    };
  }
}

export const analyticsFactory = new AnalyticsFactory();
```

---

## Quick Reference

### Factory Method Checklist

- [ ] Import BaseFactory
- [ ] Define factory class with type parameters
- [ ] Implement `mapRequestToEntity()`
- [ ] Override `applyCreateBusinessLogic()` if needed
- [ ] Override `applyUpdateBusinessLogic()` if needed
- [ ] Add specialized methods if needed
- [ ] Export singleton instance
- [ ] Add comprehensive JSDoc comments
- [ ] Include `@template-note` for guidance
- [ ] Verify no linter errors
- [ ] Test with real data

### Common Type Parameters

```typescript
BaseFactory<
  DocumentType,        // Mongoose document from schema
  CreateInputType,     // Zod create schema type
  UpdateInputType      // Zod update schema type
>
```

### When to Create a Specialized Method

- ✅ External API data integration
- ✅ AI/ML generated content
- ✅ Bulk operations
- ✅ Complex merge/refinement logic
- ✅ Data migration/import
- ✅ Multi-step transformations

---

## Support

For questions or issues with the factory pattern:

1. Review this guide thoroughly
2. Examine the Projects module factory implementation
3. Check the BaseFactory documentation in `shared/db/base.factory.ts`
4. Consult the module README files

---

**Last Updated:** 2025-01-24
**Version:** 1.0.0
**Maintainer:** Architecture Team

