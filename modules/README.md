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
import { clientsService } from "@/modules/clients/server";

// Import validation schemas from index.ts
import { CreateClientSchema } from "@/modules/clients";
```

**Client Components:**
```typescript
// Import validation schemas and types from index.ts
import { CreateClientSchema, type ClientResponse } from "@/modules/clients";

// ❌ NEVER import from server.ts in client code
```

### ❌ Incorrect Usage

```typescript
// ❌ Don't import directly from internal files
import { clientsService } from "@/modules/clients/service";
import { CreateClientSchema } from "@/modules/clients/validation";

// ❌ Don't import server exports in client code
import { clientsService } from "@/modules/clients/server"; // Client code
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
2. Copy the structure from an existing module (e.g., `clients`)
3. Create `index.ts` and `server.ts` barrel exports
4. Implement your schemas, services, and validation
5. Export appropriately through the barrel files
6. Document module-specific details in a README

## Example: Clients Module

```typescript
// modules/clients/index.ts
export { CreateClientSchema, UpdateClientSchema } from "./validation";
export type { ClientResponse, CreateClientInput } from "./validation";
export { CompanyStage, ResearchStatus } from "./types";

// modules/clients/server.ts
export { clientsService } from "./service";
export { CLIENT_MODEL_NAME } from "./schema";
export type { IClient } from "./schema";
```

Usage in API routes:
```typescript
import { clientsService } from "@/modules/clients/server";
import { CreateClientSchema } from "@/modules/clients";

export const POST = withValidation(
  CreateClientSchema,
  async (req, {}, { body }) => {
    const client = await clientsService.createClient(body);
    return NextResponse.json(client);
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

