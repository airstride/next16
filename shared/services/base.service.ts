import { IRepository } from "@/shared/db/repository.interface";
import { RepositoryFactory } from "@/shared/db/repository.factory";
import {
  CloneOperationResult,
  CloneToCollectionOptions,
} from "@/shared/types/clone.types";
import {
  BulkWriteResult,
  DatabaseId,
  EntityFilter,
  IEntity,
  IPaginationResponse,
  ISuccessResponse,
  IZod,
  QueryOptions,
} from "@/shared/types";
import {
  AccessControlContext,
  AccessControlUtil,
} from "@/shared/utils/access.control.util";

/**
 * BaseService
 *
 * An abstract base class that enforces a consistent pattern for all service classes.
 * Combines repository pattern with service layer abstractions, ensuring type safety
 * and consistent API design across all services.
 *
 * This class follows the four pillars of OOP:
 * - Inheritance: Services extend this base to inherit common functionality
 * - Encapsulation: Internal repository operations are encapsulated
 * - Abstraction: Abstract methods define the service contract
 * - Polymorphism: Concrete services implement abstract methods differently
 *
 * Type Parameters:
 *   TEntity - The entity document type (extends IEntity with DatabaseId)
 *   TRequest - The Zod-validated request type (extends IZod)
 *   TUpdateRequest - The Zod-validated update request type (extends IZod or Partial<TRequest>)
 *   TResponse - The API response type (extends ISuccessResponse for CRUD operations)
 *
 * Usage:
 *   class UserService extends BaseService<UserDocument, UserRequest, UserResponse> {
 *     constructor() {
 *       super("User"); // Just pass the model name
 *     }
 *
 *     protected mapEntityToResponse(entity: UserDocument): UserResponse {
 *       return UserResponse.fromUser(entity);
 *     }
 *
 *     protected prepareEntityForCreate(request: UserRequest, userId: string): Partial<UserDocument> {
 *       return { ...request, created_by: userId };
 *     }
 *   }
 */
export abstract class BaseService<
  TEntity extends IEntity<DatabaseId>,
  TCreateRequest extends IZod,
  TUpdateRequest extends
    | IZod
    | Partial<TCreateRequest> = Partial<TCreateRequest>,
  TResponse extends ISuccessResponse = ISuccessResponse
> {
  private _repository: IRepository<any, any> | null = null;
  private readonly modelName: string;

  /**
   * Constructor - Stores the model name for lazy initialization
   * @param modelName - The registered name of the model
   */
  constructor(modelName: string) {
    this.modelName = modelName;
  }

  /**
   * Lazy initialization of repository to prevent instantiation at module load time.
   * Uses RepositoryFactory to create the appropriate repository based on database configuration.
   * This ensures the database and models are initialized before accessing the repository.
   */
  protected get repository(): IRepository<any, any> {
    if (!this._repository) {
      // Create repository using factory - allows switching databases via configuration
      this._repository = RepositoryFactory.create<any>(this.modelName);
    }
    return this._repository;
  }

  /**
   * Abstract method to map an entity to its response representation
   * Must be implemented by concrete service classes
   * @param entity - The entity to transform
   * @returns The response representation
   */
  protected abstract mapEntityToResponse(entity: TEntity): TResponse;

  /**
   * Abstract method to prepare request data for entity creation
   * Must be implemented by concrete service classes
   * @param request - The validated request data
   * @param userId - The ID of the user creating the entity
   * @param orgId - Optional organization ID for created_by_propel_auth_org_id field
   * @returns Partial entity data ready for creation
   */
  protected abstract prepareEntityForCreate(
    request: TCreateRequest,
    userId: string,
    orgId: string,
    ...args: any[]
  ): TEntity;

  /**
   * Abstract method to prepare request data for entity updates
   * Must be implemented by concrete service classes
   * @param request - The validated request data (partial)
   * @param userId - The ID of the user updating the entity
   * @returns Partial entity data ready for update
   */
  protected abstract prepareEntityForUpdate(
    request: TUpdateRequest,
    userId: string,
    ...args: any[]
  ): Partial<TEntity>;

  /**
   * Optional method to prepare query parameters with additional context
   * Can be overridden by concrete service classes to add business logic to queries
   * @param searchParams - Original search parameters
   * @param context - Additional context (e.g., mappingId, organizationId)
   * @returns Enhanced search parameters
   */
  protected prepareEntityForQuery?(
    searchParams: URLSearchParams,
    context: Record<string, any>
  ): URLSearchParams;

  /**
   * Apply access control to search parameters
   * Template method that applies user-type and role-based access control
   * @param searchParams - The search parameters to modify
   * @param accessContext - User access control context
   * @returns URLSearchParams with access control applied
   */
  protected applyAccessControl(
    searchParams: URLSearchParams,
    accessContext: AccessControlContext,
    options: {
      applyUserLevelControl: boolean;
      applyOrganizationLevelControl: boolean;
    } = {
      applyUserLevelControl: true,
      applyOrganizationLevelControl: true,
    }
  ): URLSearchParams {
    return AccessControlUtil.applyAccessControl(
      searchParams,
      accessContext,
      options
    );
  }

  /**
   * Enhanced findAll method with access control support
   * Convenient method for services that need automatic access control
   * @param filter - Entity filter query
   * @param options - Query options
   * @param accessContext - Optional access control context to apply
   * @returns Promise resolving to paginated response
   */
  public async findAllWithAccessControl(
    filter: EntityFilter<TEntity> = {},
    options: QueryOptions = {},
    accessContext?: AccessControlContext
  ): Promise<IPaginationResponse<TResponse>> {
    // Apply access control to filter if context is provided
    let finalFilter = filter;
    if (accessContext) {
      // Convert access control parameters to filter conditions
      const accessControlParams =
        AccessControlUtil.getAccessControlParams(accessContext);
      const additionalFilter: Record<string, any> = {};

      // Map access control parameters to filter conditions
      Object.entries(accessControlParams).forEach(([key, value]) => {
        additionalFilter[key] = value;
      });

      finalFilter = { ...filter, ...additionalFilter } as EntityFilter<TEntity>;
    }

    return this.findAll(finalFilter, options);
  }

  /**
   * Abstract method to define field mappings for cloning operations
   * Optional - implement only if the service supports cloning
   * @returns Object mapping target fields to source field paths
   */
  protected getCloneFieldMappings?(): Record<string, string>;

  /**
   * Abstract method to prepare additional static fields for cloning
   * Optional - implement only if the service supports cloning
   * @param userId - ID of the user performing the clone operation
   * @returns Static fields to add to all cloned documents
   */
  protected prepareCloneStaticFields?(userId: string): Record<string, any>;

  /**
   * Create a new entity
   * Template method that orchestrates the creation process
   * @param userId - ID of the user creating the entity
   * @param request - Validated request data
   * @param orgId - Organization ID for created_by_propel_auth_org_id field
   * @returns Promise resolving to the response representation
   */
  public async create(
    userId: string,
    request: TCreateRequest,
    orgId: string
  ): Promise<TResponse> {
    const entityData = this.prepareEntityForCreate(request, userId, orgId);
    const createdEntity = await this.repository.create(entityData as TEntity);
    return this.mapEntityToResponse(createdEntity);
  }

  /**
   * Create multiple entities in a single operation
   * Template method that orchestrates the bulk creation process
   * @param requests - Array of validated request data
   * @param userId - ID of the user creating the entities
   * @param orgId - Organization ID for created_by_propel_auth_org_id field
   * @returns Promise resolving to array of response representations
   */
  public async createMany(
    userId: string,
    requests: TCreateRequest[],
    orgId: string,
    options: { ordered: boolean } = { ordered: false }
  ): Promise<TResponse[]> {
    const entitiesData = requests.map(
      (request) =>
        this.prepareEntityForCreate(request, userId, orgId) as TEntity
    );
    const createdEntities = await this.repository.insertMany(
      entitiesData,
      options
    );
    return createdEntities.map((entity) => this.mapEntityToResponse(entity));
  }

  /**
   * Upsert multiple entities in a single operation
   * Template method that orchestrates the bulk upsert process
   * @param requests - Array of validated request data
   * @param userId - ID of the user upserting the entities
   * @param orgId - Organization ID for created_by_propel_auth_org_id field
   * @param matchField - The field(s) to match on for upsert operations (defaults to '_id')
   * @param options - Bulk operation options
   * @returns Promise resolving to array of response representations
   */
  public async upsertMany(
    userId: string,
    requests: TCreateRequest[],
    orgId: string,
    matchField: keyof TEntity | (keyof TEntity)[] = "_id" as keyof TEntity,
    options: { ordered: boolean } = { ordered: false }
  ): Promise<BulkWriteResult<TResponse>> {
    const entitiesData = requests.map(
      (request) =>
        this.prepareEntityForCreate(request, userId, orgId) as TEntity
    );
    const upsertedEntities = await this.repository.bulkWrite(
      entitiesData,
      matchField,
      options
    );
    const { counts, entities } = upsertedEntities;

    return {
      counts,
      entities: entities.map((entity) => this.mapEntityToResponse(entity)),
    };
  }

  /**
   * Upsert a single entity
   * Template method that orchestrates the upsert process.
   * If the request contains an id, it will update existing or create if not found.
   * If no id is provided, it will create a new entity.
   * @param userId - ID of the user upserting the entity
   * @param request - Validated request data
   * @param orgId - Organization ID for created_by_propel_auth_org_id field
   * @returns Promise resolving to the response representation
   */
  public async upsert(
    userId: string,
    request: TCreateRequest,
    orgId: string
  ): Promise<TResponse> {
    const entityData = this.prepareEntityForCreate(
      request,
      userId,
      orgId
    ) as TEntity;
    const upsertedEntity = await this.repository.upsert(entityData);
    return this.mapEntityToResponse(upsertedEntity);
  }

  /**
   * Update an existing entity by ID
   * Template method that orchestrates the update process
   * @param id - Entity ID
   * @param request - Partial validated request data
   * @param userId - ID of the user updating the entity
   * @returns Promise resolving to the response representation or null
   */
  public async updateById(
    id: string,
    userId: string,
    request: TUpdateRequest,
    ...args: any[]
  ): Promise<TResponse | null> {
    const updateData = this.prepareEntityForUpdate(request, userId, ...args);
    const updatedEntity = await this.repository.updateById(id, updateData);
    return updatedEntity ? this.mapEntityToResponse(updatedEntity) : null;
  }

  /**
   * Find an entity by ID
   * @param id - Entity ID
   * @returns Promise resolving to the response representation or null
   */
  public async findById(id: string): Promise<TResponse | null> {
    const entity = await this.repository.findById(id);
    return entity ? this.mapEntityToResponse(entity) : null;
  }

  /**
   * Find all entities matching the filter with pagination
   * @param filter - Entity filter query (abstracted from Mongoose)
   * @param options - Query options (abstracted from Mongoose)
   * @returns Promise resolving to paginated response
   */
  public async findAll(
    filter: EntityFilter<TEntity> = {},
    options: QueryOptions = {}
  ): Promise<IPaginationResponse<TResponse>> {
    // Convert our abstracted types to Mongoose types in the repository layer
    const [entities, total] = await this.repository.find(
      filter as any,
      options as any
    );
    const data = entities.map((entity) => this.mapEntityToResponse(entity));

    const { skip = 0, limit = 10 } = options;
    const page = Math.floor(skip / limit) + 1;
    const pageCount = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        page_size: limit,
        page_count: pageCount,
      },
    } as IPaginationResponse<TResponse>;
  }

  /**
   * Find all entities matching the filter with population of referenced fields and pagination.
   * Delegates to repository's findWithPopulate.
   *
   * @param filter - Entity filter query (abstracted from Mongoose)
   * @param populateOptions - Populate options (single or array) for referenced collections
   * @param options - Query options (abstracted from Mongoose)
   * @returns Promise resolving to paginated response
   */
  public async findAllWithPopulate(
    filter: EntityFilter<TEntity> = {},
    populateOptions: any | any[],
    options: QueryOptions = {}
  ): Promise<IPaginationResponse<TResponse>> {
    const entities = await this.repository.findWithPopulate(
      filter as any,
      populateOptions,
      options as any
    );

    // Note: findWithPopulate does not provide total count, so we need to get it.
    const total =
      (await this.repository.count?.(filter as any)) ?? entities.length;

    const data = entities.map((entity) => this.mapEntityToResponse(entity));

    const { skip = 0, limit = 10 } = options;
    const page = Math.floor(skip / limit) + 1;
    const pageCount = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        page_size: limit,
        page_count: pageCount,
      },
    } as IPaginationResponse<TResponse>;
  }

  /**
   * Find all deleted entities matching the filter with pagination
   * @param filter - Entity filter query (abstracted from Mongoose)
   * @param options - Query options (abstracted from Mongoose)
   * @returns Promise resolving to paginated response
   */
  public async findAllDeleted(
    filter: EntityFilter<TEntity> = {},
    options: QueryOptions = {}
  ): Promise<IPaginationResponse<TResponse>> {
    // Convert our abstracted types to Mongoose types in the repository layer
    const [entities, total] = await this.repository.findDeleted(
      filter as any,
      options as any
    );
    const data = entities.map((entity) => this.mapEntityToResponse(entity));

    const { skip = 0, limit = 10 } = options;
    const page = Math.floor(skip / limit) + 1;
    const pageCount = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        page_size: limit,
        page_count: pageCount,
      },
    } as IPaginationResponse<TResponse>;
  }

  /**
   * Find a single entity matching the filter
   * @param filter - Entity filter query (abstracted from Mongoose)
   * @returns Promise resolving to the response representation or null
   */
  public async findOne(
    filter: EntityFilter<TEntity>
  ): Promise<TResponse | null> {
    const entity = await this.repository.findOne(filter as any);
    return entity ? this.mapEntityToResponse(entity) : null;
  }

  /**
   * Soft delete an entity by ID
   * @param id - Entity ID
   * @returns Promise resolving to the response representation or null
   */
  public async deleteById(id: string): Promise<TResponse | null> {
    const deletedEntity = await this.repository.softDelete(id);

    return deletedEntity ? this.mapEntityToResponse(deletedEntity) : null;
  }

  /**
   * Count entities matching the filter
   * @param filter - Entity filter query (abstracted from Mongoose)
   * @returns Promise resolving to the count
   */
  public async count(filter: EntityFilter<TEntity> = {}): Promise<number> {
    return this.repository.count(filter);
  }

  /**
   * Execute database aggregation pipeline
   * Note: This is database-specific and may not be supported by all repository implementations
   * @param pipeline - Aggregation pipeline array (format depends on database)
   * @returns Promise resolving to aggregation results
   * @throws Error if the repository doesn't support aggregation
   */
  public async aggregate(pipeline: any[]): Promise<any[]> {
    if (!this.repository.aggregate) {
      throw new Error(
        `Aggregation is not supported by the current repository implementation`
      );
    }
    return await this.repository.aggregate(pipeline);
  }

  /**
   * Validate if an ID is a valid MongoDB ObjectId
   * @param id - The ID to validate
   * @returns True if valid, false otherwise
   */
  public validateId(id: string): boolean {
    return this.repository.validateId(id);
  }

  /**
   * Clone documents from this service's collection to another collection
   * Template method that orchestrates the cloning process
   * @param targetCollectionName - Name of the target collection
   * @param sourceFilter - Filter to apply to source documents
   * @param userId - ID of the user performing the operation
   * @param options - Additional cloning options
   * @returns Promise with operation results
   */
  public async cloneToCollection(
    targetCollectionName: string,
    userId: string,
    sourceFilter: EntityFilter<TEntity> = {},
    options: Partial<CloneToCollectionOptions> = {}
  ): Promise<CloneOperationResult> {
    // Get field mappings from concrete implementation
    const fieldMappings = this.getCloneFieldMappings?.() || {};

    // Get static fields from concrete implementation
    const staticFields = this.prepareCloneStaticFields?.(userId) || {};

    const cloneOptions: CloneToCollectionOptions = {
      sourceFilter: sourceFilter as any,
      fieldMappings,
      staticFields,
      ...options,
    };

    return await this.repository.cloneToCollection(
      targetCollectionName,
      cloneOptions
    );
  }
}
