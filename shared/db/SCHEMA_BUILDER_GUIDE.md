# Type-Safe Schema Builder Guide

## 🎯 Overview

This guide explains how to use the **Zod-to-Mongoose Schema Builder** to create type-safe database schemas with zero duplication across your application layers.

### The Problem We Solve

Traditional approach (with duplication):
```typescript
// ❌ THREE separate definitions for the same structure
// 1. TypeScript types (types.ts)
interface IUser { name: string; email: string; age: number; }

// 2. Mongoose schema (schema.ts)
const userSchema = { name: String, email: String, age: Number };

// 3. Zod validation (validation.ts)
const UserSchema = z.object({ name: z.string(), email: z.string(), age: z.number() });
```

**Problems:**
- 3x duplication = 3x maintenance burden
- Types can drift out of sync
- No compile-time validation
- Manual updates across layers

### Our Solution

**Single Source of Truth with Zod:**
```typescript
// ✅ ONE definition for everything
// schema.definition.ts
const UserFieldsSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().nonnegative()
});

// types.ts - INFERRED from Zod
export type IUser = z.infer<typeof UserFieldsSchema> & IEntity<DatabaseId>;

// schema.ts - GENERATED from Zod
const UserSchema = zodToMongoose(UserFieldsSchema);

// validation.ts - REUSE the same Zod schema
export { UserFieldsSchema as CreateUserSchema };
```

**Benefits:**
- ✅ Define once, use everywhere
- ✅ Compile-time type safety
- ✅ Runtime validation
- ✅ Impossible for schemas to drift
- ✅ Single point of change

---

## 🏗️ Architecture Pattern

### Single Source of Truth Flow

```
┌─────────────────────────────────────┐
│  Zod Schema Definition              │
│  (domain/schema.definition.ts)      │
│                                     │
│  const UserFieldsSchema = z.object({│
│    name: z.string(),                │
│    email: z.string().email(),       │
│  });                                │
└─────────────────────────────────────┘
                  │
                  ├──────────────────┬──────────────────┬─────────────────┐
                  ▼                  ▼                  ▼                 ▼
         ┌────────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐
         │ TypeScript     │  │ Mongoose     │  │ API         │  │ Runtime      │
         │ Types          │  │ Schema       │  │ Validation  │  │ Validation   │
         │                │  │              │  │             │  │              │
         │ z.infer<>      │  │zodToMongoose()│  │ Reuse Zod  │  │ .parse()     │
         └────────────────┘  └──────────────┘  └─────────────┘  └──────────────┘
```

### Layer Responsibilities

| Layer | File | Responsibility | Source |
|-------|------|---------------|--------|
| **Domain** | `schema.definition.ts` | Define structure (Zod) | SOURCE OF TRUTH |
| **Domain** | `types.ts` | Export inferred types | Inferred from Zod |
| **Infrastructure** | `schema.ts` | Generate Mongoose schema | Generated from Zod |
| **API** | `validation.ts` | Reuse/compose Zod schemas | Imported from domain |

---

## 📚 Step-by-Step Guide

### Step 1: Define Zod Schema (Domain Layer)

Create `modules/{module}/domain/schema.definition.ts`:

```typescript
import { z } from "zod";

/**
 * Nested schemas for composition
 */
export const AddressSchema = z.object({
  street: z.string().trim(),
  city: z.string().trim(),
  zipCode: z.string().regex(/^\d{5}$/),
});

export const UserPreferencesSchema = z.object({
  theme: z.enum(["light", "dark"]).default("light"),
  notifications: z.boolean().default(true),
});

/**
 * Main entity schema
 */
export const UserFieldsSchema = z.object({
  // Required fields
  user_id: z.string().min(1),
  email: z.string().email().toLowerCase(),
  name: z.string().min(1).max(100).trim(),
  
  // Optional fields
  age: z.number().int().min(0).max(150).optional(),
  bio: z.string().max(500).trim().optional(),
  
  // Nested objects
  address: AddressSchema.optional(),
  preferences: UserPreferencesSchema,
  
  // Arrays
  tags: z.array(z.string()).default([]),
  roles: z.array(z.enum(["admin", "user", "guest"])).default(["user"]),
  
  // Dates
  last_login: z.coerce.date().optional(),
});

export type UserFields = z.infer<typeof UserFieldsSchema>;
```

**Key Points:**
- Use `snake_case` for MongoDB field names
- Define nested schemas separately for reusability
- Use Zod validators (`.min()`, `.max()`, `.email()`, etc.)
- Add `.trim()` for strings to auto-trim whitespace
- Use `.default()` for default values
- Export both schema and inferred type

### Step 2: Define Domain Types (Domain Layer)

Update `modules/{module}/domain/types.ts`:

```typescript
import { IEntity, DatabaseId } from "@/shared/types/repository.types";
import { z } from "zod";
import { UserFieldsSchema } from "./schema.definition";

// Enums (for use in Zod validation)
export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  GUEST = "guest",
}
export const UserRoleValues = Object.values(UserRole);

// Interfaces for documentation (optional but recommended)
export interface IAddress {
  street: string;
  city: string;
  zipCode: string;
}

/**
 * IUser - Inferred from Zod schema + base entity fields
 */
export type IUser = Omit<
  z.infer<typeof UserFieldsSchema>,
  keyof IEntity<DatabaseId> | "user_id"
> &
  IEntity<DatabaseId> & {
    user_id: string;
    organization_id?: string;
    deleted_at?: Date;
    deleted_by?: string;
  };

/**
 * Type-level validation
 */
type ValidateUserHasRequiredFields = IUser extends {
  _id: any;
  user_id: string;
  email: string;
  name: string;
  created_at: Date;
}
  ? true
  : never;

const _typeValidation: ValidateUserHasRequiredFields = true;
```

**Key Points:**
- Infer domain type from Zod schema
- Merge with `IEntity<DatabaseId>` for base fields
- Add compile-time validation
- Keep simple interfaces for documentation

### Step 3: Generate Mongoose Schema (Infrastructure Layer)

Update `modules/{module}/infrastructure/schema.ts`:

```typescript
import mongoose, { Schema, Model, InferSchemaType } from "mongoose";
import { modelRegistry } from "@/shared/db/model.registry";
import {
  baseUserEntityDefinition,
  IMongooseDocument,
} from "@/shared/db/base.schema.types";
import { mergeWithBaseFields } from "@/shared/db/schema.builder";
import { UserFieldsSchema } from "../domain/schema.definition";

export const USER_MODEL_NAME = "User";

/**
 * Auto-generate schema from Zod
 */
const userDefinition = mergeWithBaseFields(
  UserFieldsSchema,
  baseUserEntityDefinition
);

const UserSchema = new Schema(userDefinition, {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  collection: "users",
  versionKey: false,
});

/**
 * Add indexes
 */
UserSchema.index({ user_id: 1, is_deleted: 1 });
UserSchema.index({ email: 1 }, { unique: true });

/**
 * Document type and model
 */
export type UserDocument = IMongooseDocument<
  InferSchemaType<typeof UserSchema>
>;

const UserModel =
  (mongoose.models[USER_MODEL_NAME] as Model<UserDocument>) ||
  mongoose.model<UserDocument>(USER_MODEL_NAME, UserSchema);

modelRegistry.register<UserDocument>(USER_MODEL_NAME, UserModel);

export default UserModel;
```

**Key Points:**
- Use `mergeWithBaseFields()` to combine domain + base entity fields
- Add indexes after schema creation
- Define `UserDocument` type for repository use
- Register with model registry

### Step 4: Reuse Schemas for API Validation (API Layer)

Update `modules/{module}/api/validation.ts`:

```typescript
import { z } from "zod";
import {
  UserFieldsSchema,
  AddressSchema,
  UserPreferencesSchema,
} from "../domain/schema.definition";
import { createInputSchema, createResponseSchema } from "@/shared/validation/base.validation";

/**
 * Create User - Reuse domain schema
 */
export const CreateUserSchema = createInputSchema(
  UserFieldsSchema.omit({ user_id: true }) // user_id added by helper
);

/**
 * Update User - Partial of domain schema
 */
export const UpdateUserSchema = UserFieldsSchema.partial();

/**
 * User Preferences - Reuse nested schema
 */
export const UpdatePreferencesSchema = UserPreferencesSchema.partial();

/**
 * Response schema - Reuse domain schema
 */
const UserResponseFieldsSchema = z.object({
  email: z.string(),
  name: z.string(),
  age: z.number().optional(),
  bio: z.string().optional(),
  address: AddressSchema.optional(),
  preferences: UserPreferencesSchema,
  tags: z.array(z.string()),
  roles: z.array(z.string()),
  last_login: z.date().optional(),
});

export const UserResponseSchema = createResponseSchema(
  UserResponseFieldsSchema
);

export type UserResponse = z.infer<typeof UserResponseSchema>;
```

**Key Points:**
- Import schemas from `domain/schema.definition.ts`
- Use `.omit()`, `.pick()`, `.partial()` to compose
- No duplication - just composition!
- Schemas automatically stay in sync

### Step 5: Add Compile-Time Validation (Domain Layer)

Create `modules/{module}/domain/schema.validation.test.ts`:

```typescript
import { z } from "zod";
import { IUser } from "./types";
import { UserFieldsSchema } from "./schema.definition";
import type { UserDocument } from "../infrastructure/schema";
import type { IEntity, DatabaseId } from "@/shared/types/repository.types";

/**
 * Test: Ensure IUser extends IEntity
 */
type Test1_IUserExtendsIEntity = IUser extends IEntity<DatabaseId>
  ? true
  : "FAIL: IUser does not extend IEntity";
const _test1: Test1_IUserExtendsIEntity = true;

/**
 * Test: Ensure IUser has required fields
 */
type Test2_IUserHasRequiredFields = IUser extends {
  _id: any;
  user_id: string;
  email: string;
  name: string;
}
  ? true
  : "FAIL: IUser missing required fields";
const _test2: Test2_IUserHasRequiredFields = true;

/**
 * Test: Ensure Mongoose document matches domain
 */
type Test3_MongooseDocumentHasUserFields = UserDocument extends {
  user_id: any;
  email: any;
  name: any;
}
  ? true
  : "FAIL: UserDocument missing required fields";
const _test3: Test3_MongooseDocumentHasUserFields = true;

export type AllTypeLevelTestsPass =
  | Test1_IUserExtendsIEntity
  | Test2_IUserHasRequiredFields
  | Test3_MongooseDocumentHasUserFields;

export const TYPE_TESTS_PASSED: AllTypeLevelTestsPass = true;
```

**Key Points:**
- Use conditional types for compile-time validation
- Tests run automatically during TypeScript compilation
- Zero runtime cost
- Catches drift immediately

---

## 🎨 Zod-to-Mongoose Field Mapping

### Basic Types

| Zod Schema | Mongoose Type | Notes |
|------------|---------------|-------|
| `z.string()` | `String` | Auto-trimmed |
| `z.number()` | `Number` | |
| `z.boolean()` | `Boolean` | |
| `z.date()` | `Date` | Use `z.coerce.date()` for auto-conversion |

### Validation Mapping

| Zod Validator | Mongoose Equivalent |
|--------------|---------------------|
| `.min(n)` | `minlength: n` (string) or `min: n` (number) |
| `.max(n)` | `maxlength: n` (string) or `max: n` (number) |
| `.regex(pattern)` | `match: pattern` |
| `.email()` | *(not mapped, validated at API layer)* |
| `.url()` | *(not mapped, validated at API layer)* |

### Complex Types

| Zod Schema | Mongoose Type | Example |
|------------|---------------|---------|
| `z.enum(["a", "b"])` | `String` + `enum: ["a", "b"]` | Status fields |
| `z.array(z.string())` | `[String]` | Tags, keywords |
| `z.object({ ... })` | Subdocument | Nested objects |
| `.optional()` | `required: false` | Optional fields |
| `.default(value)` | `default: value` | Default values |

### Advanced Patterns

```typescript
// Optional with default
z.boolean().default(true)
// → { type: Boolean, default: true }

// Array with min/max
z.array(z.string()).min(1).max(5)
// → [{ type: String }] + custom validation

// Nested object
z.object({
  address: z.object({
    street: z.string(),
    city: z.string()
  })
})
// → { address: { street: String, city: String } }

// Enum from TypeScript enum
z.enum(UserRoleValues )
// → { type: String, enum: ["admin", "user", "guest"] }
```

---

## 🔧 Common Patterns

### Pattern 1: Partial Updates

```typescript
// Domain schema
export const UserFieldsSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
});

// API validation - partial for updates
export const UpdateUserSchema = UserFieldsSchema.partial();
// All fields become optional
```

### Pattern 2: Composition

```typescript
// Reusable nested schemas
export const AddressSchema = z.object({ ... });
export const PreferencesSchema = z.object({ ... });

// Compose into main schema
export const UserFieldsSchema = z.object({
  name: z.string(),
  address: AddressSchema.optional(),
  preferences: PreferencesSchema,
});
```

### Pattern 3: Omit/Pick for API Contracts

```typescript
// Create: Omit server-generated fields
export const CreateUserSchema = UserFieldsSchema.omit({
  user_id: true,
  created_at: true,
  updated_at: true,
});

// Public Profile: Pick only public fields
export const PublicUserSchema = UserFieldsSchema.pick({
  name: true,
  bio: true,
  avatar_url: true,
});
```

### Pattern 4: Extend for Variations

```typescript
// Base schema
const BaseUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

// Extended for admin
const AdminUserSchema = BaseUserSchema.extend({
  permissions: z.array(z.string()),
  is_super_admin: z.boolean(),
});
```

---

## 🐛 Troubleshooting

### Issue: "Type does not satisfy constraint"

**Problem:** Zod schema doesn't match domain type structure.

**Solution:**
1. Check `schema.validation.test.ts` for specific error
2. Ensure Zod schema has all required fields
3. Verify field types match (string vs number, etc.)
4. Run TypeScript compiler to see detailed error

### Issue: Mongoose validation errors at runtime

**Problem:** Data doesn't match schema constraints.

**Solution:**
1. Add Zod validation at API boundary: `schema.parse(data)`
2. Check that Mongoose validators were generated correctly
3. Verify `zodToMongoose()` is mapping validators properly
4. Log `projectDefinition` to inspect generated schema

### Issue: Missing fields in Mongoose document

**Problem:** Fields defined in Zod but not in Mongoose.

**Solution:**
1. Ensure you're using `mergeWithBaseFields()`
2. Check that `zodToMongooseField()` handles your Zod type
3. For unsupported types, add handling to `schema.builder.ts`
4. Verify imports are correct

### Issue: Type inference not working

**Problem:** `z.infer<>` produces `any` or incorrect type.

**Solution:**
1. Ensure Zod schema is properly exported
2. Check for circular dependencies
3. Verify TypeScript version (4.5+ required)
4. Try explicit type annotation: `const schema: z.ZodObject<...> = ...`

---

## ✅ Best Practices

### 1. Field Naming

```typescript
// ✅ Good: Use snake_case for MongoDB fields
const UserSchema = z.object({
  user_id: z.string(),
  first_name: z.string(),
  created_at: z.date(),
});

// ❌ Bad: Don't mix camelCase and snake_case
const UserSchema = z.object({
  userId: z.string(),        // camelCase
  first_name: z.string(),    // snake_case
  createdAt: z.date(),       // camelCase
});
```

### 2. Schema Organization

```typescript
// ✅ Good: Define nested schemas separately
export const AddressSchema = z.object({ ... });
export const PreferencesSchema = z.object({ ... });

export const UserFieldsSchema = z.object({
  address: AddressSchema,
  preferences: PreferencesSchema,
});

// ❌ Bad: Inline nested schemas (not reusable)
export const UserFieldsSchema = z.object({
  address: z.object({ street: z.string(), city: z.string() }),
  preferences: z.object({ theme: z.string() }),
});
```

### 3. Default Values

```typescript
// ✅ Good: Use Zod defaults (auto-applied)
const UserSchema = z.object({
  role: z.enum(["user", "admin"]).default("user"),
  is_active: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

// ❌ Bad: Don't handle defaults manually in code
// Let Zod and Mongoose handle it automatically
```

### 4. Validation

```typescript
// ✅ Good: Validate at API boundary
router.post("/users", async (req, res) => {
  const validated = CreateUserSchema.parse(req.body); // Throws if invalid
  const user = await userService.create(validated);
});

// ❌ Bad: Skip validation (trust client data)
router.post("/users", async (req, res) => {
  const user = await userService.create(req.body); // Unsafe!
});
```

### 5. Type Exports

```typescript
// ✅ Good: Export both schema and type
export const UserFieldsSchema = z.object({ ... });
export type UserFields = z.infer<typeof UserFieldsSchema>;

// ❌ Bad: Only export schema (users must infer every time)
export const UserFieldsSchema = z.object({ ... });
// No type export
```

---

## 📖 Real-World Example

See the **Projects Module** (`modules/clients/`) for a complete, production-ready implementation:

- `domain/schema.definition.ts` - Zod schemas (single source of truth)
- `domain/types.ts` - Inferred TypeScript types
- `infrastructure/schema.ts` - Auto-generated Mongoose schema
- `api/validation.ts` - Reused Zod schemas for API validation
- `domain/schema.validation.test.ts` - Compile-time type validation

**Before this pattern:**
- 800+ lines across types, schemas, and validation
- Manual sync required between layers
- Frequent bugs from drift

**After this pattern:**
- 400 lines (50% reduction)
- Automatic sync
- Compile-time errors prevent drift

---

## 🚀 Migration Guide

### Migrating an Existing Module

1. **Create Zod schemas** (`domain/schema.definition.ts`)
   - Convert Mongoose schema to Zod
   - Add validation rules
   
2. **Update domain types** (`domain/types.ts`)
   - Change `interface` to `type` with `z.infer<>`
   - Add type-level validation
   
3. **Update Mongoose schema** (`infrastructure/schema.ts`)
   - Replace manual definition with `mergeWithBaseFields()`
   - Keep indexes
   
4. **Update API validation** (`api/validation.ts`)
   - Import and reuse domain Zod schemas
   - Remove duplicated schemas
   
5. **Add type tests** (`domain/schema.validation.test.ts`)
   - Create compile-time validation
   
6. **Test thoroughly**
   - Run TypeScript compiler
   - Test API endpoints
   - Verify Mongoose operations

---

## 📞 Support

If you have questions or issues:

1. Check this guide's troubleshooting section
2. Look at the Projects module example
3. Review type errors in `schema.validation.test.ts`
4. Ask in the team chat with specific error messages

**Remember:** This pattern requires TypeScript 4.5+ and Zod 3.0+.

