/**
 * BaseFactory
 *
 * Abstract base class for all entity factories following the Factory and Template Method patterns.
 * Provides a consistent interface for transforming requests into entity data with business logic.
 *
 * This enforces the four pillars of OOP:
 * - Inheritance: Concrete factories extend this base
 * - Encapsulation: Hides transformation complexity
 * - Abstraction: Defines the factory contract
 * - Polymorphism: Each factory implements transformations differently
 *
 * Type Parameters:
 *   TEntity - The entity document type
 *   TCreateRequest - The creation request type
 *   TUpdateRequest - The update request type
 *
 * Usage:
 *   class UserFactory extends BaseFactory<UserDocument, UserRequest, UserUpdateRequest> {
 *     protected mapRequestToEntity(request) { ... }
 *     protected applyCreateBusinessLogic(request, userId, orgId) { ... }
 *     protected applyUpdateBusinessLogic(request, userId) { ... }
 *     protected getDefaultValues() { ... }
 *   }
 */
export abstract class BaseFactory<TEntity, TCreateRequest, TUpdateRequest> {
  /**
   * Create entity from request (Template Method)
   * Orchestrates the creation process:
   * 1. Get default values
   * 2. Map request to entity
   * 3. Apply business logic
   * 4. Apply default business logic
   *
   * @param request - The creation request data
   * @param userId - User creating the entity
   * @param orgId - Organization ID
   * @param context - Additional context for business logic
   * @returns Complete entity data ready for creation
   */
  public createFromRequest(
    request: TCreateRequest,
    userId: string,
    orgId: string,
    context?: Record<string, any>
  ): TEntity {
    // Step 1: Start with defaults
    const defaults = this.getDefaultValues();

    // Step 2: Map request fields to entity
    const mapped = this.mapRequestToEntity(request);

    // Step 3a: Add standard creation metadata
    const metadata = this.addCreateMetadata(userId, orgId);

    // Step 3b: Apply create-specific business logic
    const businessLogic = this.applyCreateBusinessLogic(
      request,
      userId,
      orgId,
      context
    );

    // Step 4: Apply default business logic
    const defaultBusinessLogic = this.applyDefaultBusinessLogic(userId, orgId);

    // Merge all layers (later values override earlier ones)
    return {
      ...defaults,
      ...mapped,
      ...metadata,
      ...businessLogic,
      ...defaultBusinessLogic,
    } as TEntity;
  }

  /**
   * Create entity for update (Template Method)
   * Orchestrates the update process:
   * 1. Map request to entity
   * 2. Apply update-specific business logic
   *
   * @param request - The update request data
   * @param userId - User updating the entity
   * @param context - Additional context for business logic
   * @returns Partial entity data for update
   */
  public updateFromRequest(
    request: TUpdateRequest,
    userId: string,
    context?: Record<string, any>
  ): Partial<TEntity> {
    // Step 1: Map request fields to entity
    const mapped = this.mapUpdateRequestToEntity(request);

    // Step 2a: Add standard update metadata
    const metadata = this.addUpdateMetadata(userId);

    // Step 2b: Apply update-specific business logic
    const businessLogic = this.applyUpdateBusinessLogic(
      request,
      userId,
      context
    );

    // Merge layers
    return {
      ...mapped,
      ...metadata,
      ...businessLogic,
    } as Partial<TEntity>;
  }

  /**
   * Map update request to entity fields
   * Default implementation assumes update request is compatible with create request
   */
  protected mapUpdateRequestToEntity(
    request: TUpdateRequest
  ): Partial<TEntity> {
    return this.mapRequestToEntity(
      request as unknown as Partial<TCreateRequest>
    );
  }

  /**
   * Map request fields to entity fields
   * Must be implemented by concrete factories
   * Handles field transformations (e.g., snake_case → camelCase, type conversions)
   *
   * @param request - Request data (partial for updates)
   * @returns Mapped entity fields
   */
  protected abstract mapRequestToEntity(
    request: Partial<TCreateRequest> | TUpdateRequest
  ): Partial<TEntity>;

  /**
   * Apply business logic during entity creation
   * Override this to add creation-specific business rules
   * Examples: set status, calculate fields, add metadata
   *
   * @param request - Original creation request
   * @param userId - User creating the entity
   * @param orgId - Organization ID
   * @param context - Additional context
   * @returns Business-specific entity fields
   */
  protected applyCreateBusinessLogic(
    _request: TCreateRequest,
    _userId: string,
    _orgId: string,
    _context?: Record<string, any>
  ): Partial<TEntity> {
    // Mark parameters as intentionally unused in the default implementation
    void _request;
    void _userId;
    void _orgId;
    void _context;
    return {};
  }

  /**
   * Apply business logic during entity updates
   * Override this to add update-specific business rules
   * Examples: recalculate fields, update timestamps, validate state transitions
   *
   * @param request - Update request
   * @param userId - User updating the entity
   * @param context - Additional context
   * @returns Business-specific entity fields
   */
  protected applyUpdateBusinessLogic(
    _request: TUpdateRequest,
    _userId: string,
    _context?: Record<string, any>
  ): Partial<TEntity> {
    // Mark parameters as intentionally unused in the default implementation
    void _request;
    void _userId;
    void _context;
    return {};
  }

  /**
   * Get default values for entity creation
   * Override this to set default field values
   *
   * @returns Default entity values
   */
  protected getDefaultValues(): Partial<TEntity> {
    return {};
  }

  /**
   * Apply default business logic for entity creation
   * Override this to add default business rules that aren't tied to request data
   * Examples: set creation metadata, initialize counters
   *
   * @param userId - User creating the entity
   * @param orgId - Organization ID
   * @returns Default business-specific fields
   */
  protected applyDefaultBusinessLogic(
    userId: string,
    orgId: string
  ): Partial<TEntity> {
    // Mark parameters as intentionally unused in the default implementation
    void userId;
    void orgId;
    return {};
  }

  /**
   * Add standard creation metadata (override in concrete factories if needed)
   */
  protected addCreateMetadata(userId: string, orgId: string): Partial<TEntity> {
    const now = new Date();
    // Use camelCase metadata to match this codebase's schemas
    const meta = {
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      createdByPropelAuthOrgId: orgId,
      isDeleted: false,
    };
    return meta as unknown as Partial<TEntity>;
  }

  /**
   * Add standard update metadata (override in concrete factories if needed)
   */
  protected addUpdateMetadata(userId: string): Partial<TEntity> {
    const now = new Date();
    const meta = {
      updatedAt: now,
      updatedBy: userId,
    };
    return meta as unknown as Partial<TEntity>;
  }

  /**
   * Create an entity with defaults and metadata only
   */
  public createWithDefaults(userId: string, orgId: string): Partial<TEntity> {
    const defaults = this.getDefaultValues();
    const metadata = this.addCreateMetadata(userId, orgId);
    const defaultBusinessLogic = this.applyDefaultBusinessLogic(userId, orgId);
    return {
      ...defaults,
      ...metadata,
      ...defaultBusinessLogic,
    } as Partial<TEntity>;
  }
}
