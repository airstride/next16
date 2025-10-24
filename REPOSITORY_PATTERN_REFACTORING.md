# Repository Pattern Refactoring Guide

## Current State: ❌ NOT Database-Agnostic

Your current implementation is **tightly coupled to MongoDB/Mongoose**. While you have a repository pattern, it won't allow easy switching to SQL or other databases.

### Problems with Current Implementation:

1. **BaseRepository is MongoDB-specific**
   - Uses `Model<TEntity>`, `Document`, `FilterQuery`, `UpdateQuery` from Mongoose
   - Uses MongoDB-specific operations (`$set`, aggregation pipelines)
   - Uses `Types.ObjectId` which is MongoDB-specific

2. **IEntity imports Mongoose types**
   - `Types.ObjectId` creates tight coupling
   - Should use generic `DatabaseId` instead

3. **No Interface Abstraction**
   - Services directly depend on concrete `BaseRepository`
   - Cannot swap implementations without changing service code

4. **Mongoose operations leak into service layer**
   - Services call methods that use Mongoose-specific features
   - Hard to test with mocks

---

## Solution: True Database-Agnostic Architecture

### Architecture Layers:

```
┌─────────────────────────────────────────────┐
│  API Layer (routes)                         │
│  - Handles HTTP requests                    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Service Layer                              │
│  - Business logic                           │
│  - Depends on IRepository<T> interface      │ ← Database-agnostic!
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Repository Interface (IRepository<T>)      │
│  - Defines contract for data operations     │
│  - NO database-specific types               │
└─────────────────────────────────────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
┌─────▼──────────┐    ┌────────▼────────┐
│ MongoRepository│    │  SQLRepository   │
│  (Mongoose)    │    │  (TypeORM/Prisma)│
└────────────────┘    └──────────────────┘
```

### Step-by-Step Refactoring Plan:

#### Step 1: Create Database-Agnostic Types ✓ (DONE)

File: `shared/types/repository.types.ts`

```typescript
// Generic ID type - works with any database
export type DatabaseId = string | number | object;

// Entity interface with no DB-specific types
export interface IEntity<TId = DatabaseId> {
  _id: TId;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
  is_deleted?: boolean;
  created_by_propel_auth_org_id?: string;
}

// Generic filter type
export type EntityFilter<T> = {...}; // Already done

// Generic query options
export interface QueryOptions {...}; // Already done
```

#### Step 2: Create Repository Interface ✓ (DONE)

File: `shared/db/repository.interface.ts`

Defines the contract that ALL repository implementations must follow:
- `create()`, `find()`, `update()`, etc.
- Uses only generic types (no Mongoose types)
- Easy to mock for testing

#### Step 3: Rename & Refactor BaseRepository → MongooseRepository

File: `shared/db/mongoose.repository.ts` (renamed from base.repository.ts)

```typescript
import { IRepository } from "./repository.interface";

export class MongooseRepository<TEntity extends IEntity & Document>
  implements IRepository<TEntity, Types.ObjectId>
{
  // Implementation specific to MongoDB/Mongoose
  // Can use all Mongoose-specific features internally
}

export { MongooseRepository };
```

#### Step 4: Update BaseService to Use Interface

File: `shared/services/base.service.ts`

```typescript
export abstract class BaseService<
  TEntity extends IEntity,
  TCreateRequest extends IZod,
  TUpdateRequest extends IZod | Partial<TCreateRequest> = Partial<TCreateRequest>,
  TResponse extends ISuccessResponse = ISuccessResponse
> {
  // Depend on interface, not concrete implementation
  private _repository: IRepository<TEntity> | null = null;
  
  protected get repository(): IRepository<TEntity> {
    if (!this._repository) {
      // Factory method to create appropriate repository
      this._repository = this.createRepository();
    }
    return this._repository;
  }
  
  // Allow subclasses to override repository implementation
  protected createRepository(): IRepository<TEntity> {
    // Default to Mongoose, but can be overridden
    return new MongooseRepository<any>(this.modelName);
  }
}
```

#### Step 5: Create SQL Repository (Future)

File: `shared/db/sql.repository.ts`

```typescript
import { IRepository } from "./repository.interface";
import { DataSource } from "typeorm"; // or Prisma, etc.

export class SQLRepository<TEntity extends IEntity>
  implements IRepository<TEntity, number>
{
  constructor(private dataSource: DataSource, private entityName: string) {}
  
  async create(entity: Partial<TEntity>): Promise<TEntity> {
    // SQL-specific implementation using TypeORM/Prisma
    const repository = this.dataSource.getRepository(this.entityName);
    return await repository.save(entity);
  }
  
  async find(filter: EntityFilter<TEntity>, options: QueryOptions): Promise<[TEntity[], number]> {
    // SQL-specific implementation
    const queryBuilder = this.dataSource
      .createQueryBuilder(this.entityName, 'entity')
      .where(filter)
      .skip(options.skip)
      .take(options.limit);
    
    const [entities, count] = await queryBuilder.getManyAndCount();
    return [entities, count];
  }
  
  // ... implement all other IRepository methods
}
```

#### Step 6: Use Dependency Injection

Create a repository factory:

File: `shared/db/repository.factory.ts`

```typescript
import { IRepository } from "./repository.interface";
import { MongooseRepository } from "./mongoose.repository";
import { SQLRepository } from "./sql.repository";

export type DatabaseType = "mongodb" | "postgres" | "mysql";

export class RepositoryFactory {
  private static dbType: DatabaseType = "mongodb"; // From env var
  
  static create<TEntity extends IEntity>(
    modelName: string
  ): IRepository<TEntity> {
    switch (this.dbType) {
      case "mongodb":
        return new MongooseRepository<any>(modelName);
      case "postgres":
      case "mysql":
        return new SQLRepository<TEntity>(dataSource, modelName);
      default:
        throw new Error(`Unsupported database type: ${this.dbType}`);
    }
  }
  
  static setDatabaseType(type: DatabaseType) {
    this.dbType = type;
  }
}
```

Then in BaseService:

```typescript
protected createRepository(): IRepository<TEntity> {
  return RepositoryFactory.create<TEntity>(this.modelName);
}
```

---

## Benefits of This Refactoring:

1. **✅ True Database Agnosticism**
   - Swap MongoDB → PostgreSQL by changing one configuration
   - No code changes in services or API layer

2. **✅ Better Testing**
   - Mock `IRepository` interface easily
   - Test services without database

3. **✅ Cleaner Architecture**
   - Clear separation of concerns
   - Each layer has single responsibility

4. **✅ Future-Proof**
   - Add new databases (Redis, DynamoDB) by implementing interface
   - Microservices can use different databases

5. **✅ Better Type Safety**
   - Interface enforces consistent API across implementations
   - Compile-time checks for implementations

---

## Migration Path (Recommended):

### Phase 1: Internal Refactoring (No Breaking Changes)
1. Keep `BaseRepository` class name
2. Make it implement `IRepository` interface
3. Update internal method signatures
4. **Result:** Same API, better architecture

### Phase 2: Service Layer Update
1. Update `BaseService` to use `IRepository` type
2. Keep `MongooseRepository` as default implementation
3. Add factory method for DI
4. **Result:** Services are now database-agnostic

### Phase 3: Add Alternative Implementations
1. Create `SQLRepository` (optional)
2. Create `MockRepository` for testing
3. Configure via environment variables
4. **Result:** Full flexibility to switch databases

---

## Current Files Created:

✅ `shared/db/repository.interface.ts` - Database-agnostic interface
✅ `shared/types/repository.types.ts` - Updated with generic `DatabaseId`

## Files That Need Updates:

- `shared/db/base.repository.ts` → Rename to `mongoose.repository.ts`, implement interface
- `shared/services/base.service.ts` → Use `IRepository` interface
- `shared/types/index.ts` → Export new types

---

## Conclusion

Your current architecture has a repository pattern, but it's **tightly coupled to MongoDB**. To truly support database switching, you need:

1. ✅ Interface-based design (IRepository)
2. ✅ Generic, database-agnostic types  
3. ❌ Concrete implementations per database (MongooseRepository, SQLRepository)
4. ❌ Dependency injection / factory pattern
5. ❌ Services depending on interface, not concrete class

The refactoring is straightforward but requires systematic updates across multiple files. The interface and types are already created - now you need to update the concrete implementations and wire them together.

