# Growthmind Development TODO List

### Prerequisites & Infrastructure
**These must be completed before building the Projects Module**

### Database Setup
- [x] Set up MongoDB connection with `DatabaseService` in `shared/db/database.service.ts`
  - [x] Environment-specific connection pooling (dev/production/serverless)
  - [x] Connection helper with bounded retry logic
  - [x] Connection state logging and race condition prevention
  - [x] Model registry pattern for modular architecture
  - [x] Type-safe model registration with generics

#### Authentication (PropelAuth)
- [x] Install PropelAuth Next.js package
  - [x] Run `yarn add @propelauth/nextjs`
  - [x] Note: May show peer dependency warning for Next.js 16 (safe to ignore)
- [x] Configure PropelAuth environment variables
  - [x] Add `PROPELAUTH_AUTH_URL` to `.env.example`
  - [x] Add `PROPELAUTH_API_KEY` to `.env.example`
  - [x] Add `PROPELAUTH_VERIFIER_KEY` to `.env.example`
  - [x] Add `PROPELAUTH_REDIRECT_URI` to `.env.example`
- [x] Create `.env.example` with PropelAuth variables
- [x] Create authentication service in `shared/auth/auth.service.ts`
  - [x] User management functions (getUsersByQuery, getUser, updateUser, deleteUser)
  - [x] Organization management (getOrganisations, createOrganisation, updateOrganisation, deleteOrganisation)
  - [x] User-organization relationship functions (getUsersByOrg, inviteUser, removeUserFromOrg, updateUserRoleInOrg)
  - [x] Invite management (getInvitesByOrg, revokeInvite)
  - [x] Auth helpers (getUserFromAuthHeader, sanitizeOrganizationName)
  - [x] Custom PropelAuthError class with error handling
  - [x] Type aliases for decoupling from PropelAuth types

#### React Query (TanStack Query)
- [x] Install React Query packages
  - [x] Run `yarn add @tanstack/react-query @tanstack/react-query-devtools`
  - [x] Core library for server state management
- [x] Create query client in `shared/query/query.client.ts`
  - [x] Configure QueryClient with sensible defaults
  - [x] Set staleTime (5 minutes) and gcTime (10 minutes)
  - [x] Configure retry logic (skip 4xx errors, max 2 retries for 5xx)
  - [x] Enable refetchOnWindowFocus and refetchOnReconnect
  - [x] Export helper functions: invalidateQueries, removeQueries, clearCache, prefetchQuery
- [x] Create QueryProvider in `components/providers/QueryProvider.tsx`
  - [x] Wrap app with QueryClientProvider
  - [x] Include ReactQueryDevtools in development mode
  - [x] Export QueryProvider component
- [x] Integrate QueryProvider in root layout
  - [x] Import and wrap children with QueryProvider in `app/layout.tsx`
  - [x] Ensure it's inside any auth providers (integrated via GlobalProviders)
  - [x] Verify devtools appear in development

#### Error Handling
- [x] Create custom error classes in `shared/utils/errors.ts`
  - [x] `BaseError` - Base error class with statusCode and metadata
  - [x] `ValidationError` - 400 errors for input validation failures (with `.fromZod()` helper)
  - [x] `AuthenticationError` - 401 errors for missing/invalid auth
  - [x] `AuthorizationError` - 403 errors for insufficient permissions
  - [x] `NotFoundError` - 404 errors for missing resources
  - [x] `ConflictError` - 409 errors for duplicate resources
  - [x] `RateLimitError` - 429 errors for rate limit exceeded
  - [x] `DatabaseError` - 500 errors for database operation failures (with `.fromMongoose()` helper)
  - [x] `ExternalServiceError` - 502 errors for third-party API failures
  - [x] `ServiceUnavailableError` - 503 errors for service unavailable
  - [x] Error serialization method for consistent API responses (`.toJSON()`)
  - [x] Error logging integration with logger (automatic `.log()`)
  - [x] `ErrorHandler` class with `.handle()` and `.handleAsync()` methods
  - [x] `ErrorResponse` helpers for quick error responses
  - [x] `withErrorHandler` HOF for automatic error handling in routes
  - [x] Created `shared/api/response.helper.ts` with success response utilities
  - [x] Created comprehensive documentation in `shared/api/README.md`
  - [x] Created quick reference guide in `shared/utils/ERROR_HANDLING_GUIDE.md`

#### API Utilities
- [x] Create query parser in `shared/utils/query.parser.ts`
  - [x] Generic `UniversalQueryParser<T>` class with strict type-safe configuration
  - [x] `parse()` - Parse and validate URL search params with operator support
  - [x] `parsePagination()` - Extract page, page_size, skip from query
  - [x] `parseFilters()` - Parse filter parameters with operator support (eq, neq, gt, gte, lt, lte, in, nin, contains, starts, ends)
  - [x] `parseSorting()` - Parse sort field and direction (comma-separated, +/- prefix)
  - [x] `parseSearch()` - Parse search across configured text/exact fields
  - [x] Strict type-safe configuration with compile-time completeness checking
  - [x] Default values for pagination (page: 1, page_size: 20, maxPageSize: 100)
  - [x] `baseFilterableFields` and `optionalBaseFilterableFields` helpers for common schema fields
  - [x] `QueryValidationError` class for detailed validation error messages

#### Repository Layer
- [x] Create `BaseRepository<T>` class in `shared/db/base.repository.ts`
  - [x] Generic repository pattern with lazy model initialization from registry
  - [x] CRUD operations: `create()`, `findById()`, `findOne()`, `find()` with pagination
  - [x] `updateById()` - Update document by ID with validation
  - [x] `atomicUpdate()` - Atomic updates using MongoDB $set operator
  - [x] `softDelete()` - Soft delete support (is_deleted flag)
  - [x] `count()` - Count documents with filters (excludes soft-deleted)
  - [x] `validateId()` - MongoDB ObjectId validation
  - [x] Query building with filters, pagination, sorting
  - [x] Populate/include relationship handling (`findWithPopulate()`, `findByIdWithPopulate()`)
  - [x] Bulk operations: `insertMany()`, `bulkWrite()`, `upsert()`
  - [x] `findDeleted()` - Query soft-deleted records
  - [x] `updateByIdWithArrayFilters()` - Array filter support for nested updates
  - [x] `cloneToCollection()` - High-performance cloning using aggregation pipeline
  - [x] Soft-delete logic automatically applied to all queries
  - [x] Enhanced error handling with model context

#### Service Layer
- [x] Create `BaseService` class in `shared/services/base.service.ts`
  - [x] Abstract base class with OOP principles (Inheritance, Encapsulation, Abstraction, Polymorphism)
  - [x] Lazy-initialized protected `repository` property of type `BaseRepository<T>`
  - [x] Abstract methods: `mapEntityToResponse()`, `prepareEntityForCreate()`, `prepareEntityForUpdate()`
  - [x] Optional methods: `prepareEntityForQuery()`, `getCloneFieldMappings()`, `prepareCloneStaticFields()`
  - [x] CRUD operations: `create()`, `createMany()`, `upsert()`, `upsertMany()`, `updateById()`, `findById()`, `findAll()`, `findOne()`, `deleteById()`
  - [x] Advanced queries: `findAllWithPopulate()`, `findAllDeleted()`, `findAllWithAccessControl()`
  - [x] Access control: `applyAccessControl()` with user-level and organization-level filtering
  - [x] Aggregation support: `aggregate()` method for complex queries
  - [x] Cloning support: `cloneToCollection()` with field mappings and static fields
  - [x] Helper methods: `count()`, `validateId()`
  - [x] Type-safe generics: `TEntity`, `TCreateRequest`, `TUpdateRequest`, `TResponse`
  - [x] Audit tracking support (created_by, updated_by, created_by_propel_auth_org_id)

#### API Higher-Order Functions (HOFs)
- [x] Create `withAuth` HOF in `shared/api/with-auth.ts`
  - [x] Wrap API routes with PropelAuth authentication
  - [x] Extract user from request and add to context (`auth` prop)
  - [x] Handle authentication errors (401 Unauthorized)
  - [x] Handle authorization errors (403 Forbidden)
  - [x] Add user info to props: `auth.user`, `auth.userId`, `auth.activeOrgId`, etc.
  - [x] Validate PropelAuth tokens via AuthService
  - [x] Support permission-based access control (`PermissionConfig`)
  - [x] Support role-based access control (requiredRoles, anyRoles)
  - [x] Custom permission check function support

- [x] Create `withDb` HOF in `shared/api/with-db.ts`
  - [x] Ensure database connection before route handler executes
  - [x] Call `DatabaseService.connect()` automatically
  - [x] Handle connection errors gracefully
  - [x] Add database metadata to props for debugging
  - [x] Enhance errors with database context
  - [x] Automatic connection state tracking

- [x] Create `withValidation` HOF in `shared/api/with-validation.ts`
  - [x] Validate request body with Zod schemas
  - [x] Return 400 errors with detailed Zod error messages
  - [x] Type-safe: infer validated data types from Zod schemas
  - [x] Parse and validate JSON body automatically
  - [x] Handle Zod validation errors gracefully
  - [x] Add validated data to props: `body`
  - [x] Support custom error messages
  - [x] Created `withPatchValidation` for PATCH requests
  - [x] JSON Patch (RFC 6902) support for PATCH operations
  - [x] Convert JSON Patch operations to partial update objects

- [x] Create HOF composition helper in `shared/api/with-auth.ts`
  - [x] `compose()` - Combine multiple HOFs
  - [x] Type-safe middleware composition
  - [x] Example: `compose(withAuth, withDb, withValidation(schema))`
  - [x] Execution order: right-to-left (standard function composition)
  - [x] Error handling at each layer (bubbles up)

#### API Response Helpers
- [x] Create response utilities in `shared/api/response.helpers.ts`
  - [x] `successResponse<T>(data: T, status?)` - Standard success response format
  - [x] `paginatedResponse<T>(data: T[], meta)` - Response with pagination metadata
  - [x] `errorResponse(message, status, details?)` - Standard error response format
  - [x] `notFoundResponse(resource?)` - 404 Not Found responses
  - [x] `unauthorizedResponse(message?)` - 401 Unauthorized responses
  - [x] `forbiddenResponse(message?)` - 403 Forbidden responses
  - [x] `validationErrorResponse(details, message?)` - 400 Validation Error responses
  - [x] `conflictResponse(message?)` - 409 Conflict responses
  - [x] `createdResponse<T>(data)` - 201 Created responses
  - [x] `noContentResponse()` - 204 No Content responses
  - [x] Consistent JSON structure across all endpoints

#### Client-Side API Utilities
- [x] Create client API fetch wrapper in `shared/api/api.client.ts`
  - [x] Type-safe wrapper around native fetch API
  - [x] Bearer token authentication with `setAccessTokenGetter()` and `getBearerToken()`
  - [x] HTTP method helpers: `get()`, `post()`, `put()`, `patch()`, `del()`
  - [x] Automatic JSON serialization/deserialization
  - [x] FormData support for file uploads
  - [x] Streaming response support with `readDataFromStream()`
  - [x] Enriched error objects with status, data, url, method
  - [x] `/v1/` prefix for all requests (maps to API routes via next.config.mjs rewrite)
  - [x] Cache control support for GET requests
  - [x] Custom headers support
  - [x] TypeScript generics for response types

#### Type Definitions
- [x] Update `shared/types/index.ts` with common API types
  - [x] Created `shared/types/api-hof.types.ts` with HOF type definitions
  - [x] `NextRouteContext<P>` - Next.js 15+ route context with async params
  - [x] `CoreHandler<P, TProps>` - Core handler type that HOFs wrap
  - [x] `NextRouteHandler<P>` - Final route handler type for Next.js
  - [x] `WithAuthProps` - Authentication properties injected by withAuth
  - [x] `PermissionConfig` - Permission configuration for access control
  - [x] All types properly exported from `shared/types/index.ts`

#### Database agnostic repository pattern
  ....

---

# 🎯 DEVELOPMENT APPROACH: BACKEND-FIRST WITH INTEGRATION TESTS

**Current Focus:** Build and validate backend APIs for v0.1, v0.2, and v0.3 via integration tests BEFORE any frontend development.

## Development Order
1. ✅ **Prerequisites & Infrastructure** - COMPLETE
2. 🔄 **Phase v0.1 Backend** - Projects + Strategy modules with integration tests
3. ⏳ **Phase v0.2 Backend** - Inngest event engine + Tasks module with integration tests
4. ⏳ **Phase v0.3 Backend** - Content generation agents with integration tests
5. ⏳ **Frontend Development** - Build UI after all backend is validated

## Key Principles
- ✅ Test via integration tests following `tests/integration/ai/partner.research.test.ts` pattern
- ✅ Use real AI providers in tests for true integration validation
- ✅ Test all API endpoints, workflows, and business logic
- ✅ Validate with Airstride data before building UI
- ❌ NO frontend work until backend is complete and tested

---

## Phase v0.1 — Strategy Generator (BACKEND ONLY)
**Goal:** Generate first 30-day plan (no automation) - Backend + Integration Tests ONLY

**Testing Philosophy:** All backend functionality must be validated via integration tests before building frontend.
Use Jest integration tests following the pattern in `tests/integration/ai/partner.research.test.ts`.

### Projects Module (Context Ingestion)

**Domain Model Architecture:**
- **Project** = Persistent company/product context (the "truth file")
  - ONE per company/product
  - Company profile, product, ICP, baseline brand voice, default goals
  - Long-lived, rarely changes
- **Campaign** = Separate module (to be implemented later)
  - Will be a standalone module in `modules/campaigns/`
  - Multiple campaigns per project (via project_id reference)
  - Each with specific goals, voice overrides, date ranges
  - Examples: product launch, feature release, SEO content campaign

For v0.1 MVP: Projects-only implementation. Campaigns module will be added as a separate module when needed.

- [x] Define Mongoose schema in `modules/projects/schema.ts`
  - [x] Company profile fields (name, industry, stage, website)
  - [x] Product description
  - [x] ICP (ideal customer profile)
  - [x] Business goals (traffic, leads, revenue targets)
  - [x] Existing clients and revenue data
  - [x] Brand voice guidelines
  - [x] Current campaigns
  - [x] Marketing assets (URLs, social handles)
  - [x] Research metadata (researchStatus, researchedAt, researchSource)
  - [x] **ENHANCED:** Competitors (name, website, positioning, strengths, weaknesses, traffic)
  - [x] **ENHANCED:** Current metrics (traffic, leads, conversion rate, CAC, LTV, top pages/keywords, traffic sources)
  - [x] **ENHANCED:** Content inventory (blog posts, case studies, whitepapers, videos, publishing frequency, themes)
  - [x] **ENHANCED:** Tech stack (CMS, analytics, email, CRM, social scheduling, marketing automation, SEO tools)
  - [x] **ENHANCED:** Resources (team size, marketing team, writers, in-house capabilities, budgets)
  - [x] **ENHANCED:** Conversion funnel (awareness channels, consideration assets, decision triggers, primary CTA, bottleneck)
- [x] Create Zod validation schemas in `modules/projects/validation.ts`
  - [x] Website URL input validation (for AI research trigger)
  - [x] AI-extracted context validation schema
  - [x] Manual context override validation
  - [x] Update context validation
  - [x] Response schemas
- [x] Implement AI research service in `modules/projects/service.ts`
  - [x] `researchWebsite(websiteUrl)` - Use ai-sdk with web search to research company
    - [x] Use `generateStructuredOutputWithWebSearch()` from ai-sdk
    - [x] Extract company name, industry, stage, product description
    - [x] Identify potential ICP based on website content
    - [x] Extract social handles and marketing assets
    - [x] Analyze brand voice from website content
    - [x] Infer business goals from website messaging
    - [x] **ENHANCED PROMPT:** Comprehensive competitive intelligence extraction
    - [x] **ENHANCED PROMPT:** Competitor analysis (3-5 competitors with positioning, strengths, weaknesses)
    - [x] **ENHANCED PROMPT:** Performance metrics extraction (traffic, conversion data from SimilarWeb/Ahrefs)
    - [x] **ENHANCED PROMPT:** Content inventory counting (blog posts, case studies, publishing frequency)
    - [x] **ENHANCED PROMPT:** Tech stack detection (BuiltWith data, CMS, analytics, email platforms)
    - [x] **ENHANCED PROMPT:** Team size research (LinkedIn company page data)
    - [x] **ENHANCED PROMPT:** Conversion funnel mapping (CTAs, lead magnets, sales triggers)
  - [x] `createProjectFromWebsite(websiteUrl, userId)` - Research + create project
    - [x] Call `researchWebsite()` to get AI-extracted context
    - [x] Store extracted data in Projects schema
    - [x] Mark as AI-researched with metadata
    - [x] Allow manual refinement later
  - [x] `createProject(data)` - Create project with manual data
  - [x] `getProjectContext(projectId)` - Retrieve project data
  - [x] `updateContext(projectId, updates)` - Update project details
  - [x] `refineContext(projectId, refinements)` - User refines AI-extracted data
- [x] Build API routes for projects module (lightweight pattern)
  - [x] GET /api/projects - List all projects for organization
  - [x] POST /api/projects - Create project manually
  - [x] POST /api/projects/research - Submit website URL for AI research
  - [x] GET /api/projects/:id - Get project by ID
  - [x] PATCH /api/projects/:id - Update project
  - [x] DELETE /api/projects/:id - Delete project (soft delete)
  - [x] POST /api/projects/:id/refine - Refine AI-extracted context
  - [x] All routes use lightweight pattern: withAuth → withDb → withValidation → service call
  - [x] All routes use createErrorResponse helper for consistent error handling
  - [x] All routes include proper ownership verification for user/org access control
  - [x] Fixed nativeEnum usage to z.enum with array values per project rules

#### Projects Module Integration Tests
- [ ] Create test file: `tests/integration/projects/projects.test.ts`
  - [ ] Test: Create project manually via API (POST /api/projects)
    - [ ] Verify response structure matches schema
    - [ ] Verify project is saved to database with correct ownership
    - [ ] Verify audit fields (created_by, created_at)
  - [ ] Test: Research website and create project (POST /api/projects/research)
    - [ ] Test with real company website (e.g., "Shopify")
    - [ ] Verify AI extracts company profile correctly
    - [ ] Verify products array is populated
    - [ ] Verify research metadata is set
    - [ ] Add 90-second timeout for AI operations
  - [ ] Test: Get project by ID (GET /api/projects/:id)
    - [ ] Verify retrieval of created project
    - [ ] Verify access control (user can only get own org's projects)
  - [ ] Test: Update project (PATCH /api/projects/:id)
    - [ ] Verify partial updates work
    - [ ] Verify updated_at timestamp changes
  - [ ] Test: Refine AI-extracted context (POST /api/projects/:id/refine)
    - [ ] Verify user can override AI-extracted data
  - [ ] Test: Delete project (DELETE /api/projects/:id)
    - [ ] Verify soft delete (is_deleted flag)
    - [ ] Verify deleted project not returned in list
  - [ ] Test: List all projects (GET /api/projects)
    - [ ] Verify pagination works
    - [ ] Verify filtering by organization
- [ ] Create test file: `tests/integration/projects/projects.service.test.ts`
  - [ ] Test: AI website research with web search
    - [ ] Mock or use real AI provider (prefer real for integration)
    - [ ] Verify structured output format
    - [ ] Test with multiple company types (SaaS, e-commerce, service)
  - [ ] Test: Service layer business logic
    - [ ] Verify prepareEntityForCreate adds correct defaults
    - [ ] Verify mapEntityToResponse formats correctly

### Strategy Module (Plan Generation - BACKEND ONLY)
- [ ] Define Mongoose schema in `modules/strategy/schema.ts`
  - [ ] Plan metadata (projectId, createdAt, version)
  - [ ] Strategy pillars (narrative, channels, tactics)
  - [ ] 30-day content calendar
  - [ ] KPIs and success metrics
  - [ ] Status (draft, active, completed)
  - [ ] Audit fields (created_by, updated_by, created_by_propel_auth_org_id)
- [ ] Create Zod validation schemas in `modules/strategy/validation.ts`
  - [ ] Plan generation input (projectId, optional overrides)
  - [ ] Plan output structure (strategy pillars, calendar, KPIs)
  - [ ] Plan response schema
- [ ] Build AI provider abstraction (use existing ai-sdk)
  - [ ] Verify `generateStructuredOutput()` supports strategy generation
  - [ ] Create strategy prompt template in `lib/ai-sdk/prompts/`
  - [ ] Create strategy schema in `lib/ai-sdk/schemas/strategy.schema.ts`
  - [ ] Use AIProvider.ANTHROPIC or AIProvider.GOOGLE based on performance
- [ ] Implement service layer in `modules/strategy/service.ts`
  - [ ] Extend BaseService<StrategyEntity, CreateStrategyRequest, UpdateStrategyRequest, StrategyResponse>
  - [ ] `generatePlan(projectContext)` - Call AI to generate 30-day strategy
    - [ ] Use `generateStructuredOutput()` from ai-sdk
    - [ ] Pass project context (company profile, ICP, goals, brand voice)
    - [ ] Temperature: 0.5-0.7 for balanced creativity
    - [ ] Return structured plan with narrative, tactics, calendar
  - [ ] `storePlan(plan)` - Save plan to database via repository
  - [ ] `getPlan(planId)` - Retrieve plan
  - [ ] `getPlansByProject(projectId)` - Get all plans for a project
  - [ ] Create comprehensive prompt template for 30-day plan generation
- [ ] Create repository in `modules/strategy/repository.ts`
  - [ ] Extend BaseRepository<StrategyEntity>
  - [ ] Custom query methods if needed
- [ ] Build API routes in `app/api/strategy/`
  - [ ] POST /api/strategy/generate - Generate new plan from projectId
    - [ ] Use withAuth, withDb, withValidation HOFs
    - [ ] Validate projectId exists and user has access
    - [ ] Call service.generatePlan()
    - [ ] Return plan with 201 Created
  - [ ] GET /api/strategy/:id - Get plan by ID
    - [ ] Verify user has access to project
  - [ ] GET /api/strategy?projectId=X - List plans for project
    - [ ] Use query parser for pagination
  - [ ] PATCH /api/strategy/:id - Update plan (for manual refinements)
  - [ ] DELETE /api/strategy/:id - Soft delete plan

#### Strategy Module Integration Tests
- [ ] Create test file: `tests/integration/strategy/strategy.test.ts`
  - [ ] Test: Generate plan from project (POST /api/strategy/generate)
    - [ ] First create a test project via Projects API
    - [ ] Generate plan using projectId
    - [ ] Verify AI returns structured plan with all required fields
    - [ ] Verify plan includes strategy pillars
    - [ ] Verify 30-day calendar is populated with tasks
    - [ ] Verify KPIs are defined
    - [ ] Add 90-120 second timeout for AI plan generation
  - [ ] Test: Get plan by ID (GET /api/strategy/:id)
    - [ ] Verify retrieval of generated plan
    - [ ] Verify access control
  - [ ] Test: List plans by project (GET /api/strategy?projectId=X)
    - [ ] Verify all plans for project are returned
    - [ ] Verify pagination
  - [ ] Test: Update plan (PATCH /api/strategy/:id)
    - [ ] Test manual refinement of AI-generated plan
  - [ ] Test: Delete plan (DELETE /api/strategy/:id)
    - [ ] Verify soft delete
- [ ] Create test file: `tests/integration/strategy/strategy.service.test.ts`
  - [ ] Test: AI plan generation with different project types
    - [ ] SaaS company context
    - [ ] E-commerce company context
    - [ ] Service business context
  - [ ] Test: Prompt engineering validation
    - [ ] Verify plan quality for real company (e.g., Airstride)
    - [ ] Verify calendar tasks are actionable
    - [ ] Verify tactics are specific and relevant

### v0.1 Success Criteria (Backend Only)
- [ ] Projects API fully functional and tested
- [ ] Strategy API fully functional and tested
- [ ] AI website research works reliably
- [ ] AI plan generation produces quality 30-day plans
- [ ] All integration tests passing
- [ ] Can test end-to-end via API calls (Postman/curl)
- [ ] Airstride project can be created and plan generated
- [ ] Document learnings and prompt iterations

---

## Phase v0.2 — Task Engine (BACKEND ONLY)
**Goal:** Event-driven architecture foundation - Backend + Integration Tests ONLY

**Testing Philosophy:** All Inngest event flows must be validated via integration tests. Test event emission, event handling, and complete workflows end-to-end.

### Inngest Setup
- [ ] Configure Inngest client in `inngest/client.ts`
  - [ ] Add INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY to environment
  - [ ] Initialize Inngest client with app name and event key
  - [ ] Set up error handling and logging
  - [ ] Configure default retry and timeout settings
- [ ] Create Inngest serve endpoint
  - [ ] Add `/api/inngest` route for Inngest to call functions
  - [ ] Register all Inngest functions
  - [ ] Enable Inngest dev server for local development
  - [ ] Set up concurrency limits per function
  - [ ] Configure idempotency windows (default: 24h)

### Event Schema & Registry
- [ ] Create base event types in `shared/types/inngest.types.ts` ✅
  - [ ] Define `BaseEvent<TName, TData>` interface
  - [ ] Define `BaseEventMetadata` with timestamp, userId, projectId, version, correlationId, source
  - [ ] Create `createEvent()` helper function
  - [ ] Create `isBaseEvent()` type guard
  - [ ] Export helper types: `EventData<T>`, `EventName<T>`
- [ ] Define event schemas in `modules/events/schema.ts`
  - [ ] All events MUST extend `BaseEvent<TName, TData>`
  - [ ] `ProjectCreatedEvent extends BaseEvent<'project.created', ProjectCreatedData>`
  - [ ] `ProjectUpdatedEvent extends BaseEvent<'project.updated', ProjectUpdatedData>`
  - [ ] `PlanGeneratedEvent extends BaseEvent<'plan.generated', PlanGeneratedData>`
  - [ ] `TaskCreatedEvent extends BaseEvent<'task.created', TaskCreatedData>`
  - [ ] `TaskUpdatedEvent extends BaseEvent<'task.updated', TaskUpdatedData>`
  - [ ] `TaskExecutedEvent extends BaseEvent<'task.executed', TaskExecutedData>`
  - [ ] Define payload data types for each event
- [ ] Create event registry in `modules/events/registry.ts`
  - [ ] Export union type of all events: `type GrowthmindEvent = ProjectCreatedEvent | PlanGeneratedEvent | ...`
  - [ ] Export event name union: `type GrowthmindEventName = GrowthmindEvent['name']`
  - [ ] Add TypeScript types for all events
  - [ ] Document event payload structures
  - [ ] Add examples for each event type

### Projects Module Events
- [ ] Add Inngest handlers to `modules/projects/inngest.ts`
  - [ ] Import `BaseEvent` and `createEvent` from `shared/types/inngest.types`
  - [ ] Import event types from `modules/events/schema`
  - [ ] Emit `ProjectCreatedEvent` when project is created
  - [ ] Emit `ProjectUpdatedEvent` when context changes
  - [ ] Ensure all events use `createEvent()` helper for type safety
- [ ] Update service layer to trigger events
  - [ ] Call Inngest client in `createProject()` with properly typed event
  - [ ] Call Inngest client in `updateContext()` with properly typed event
  - [ ] Pass required metadata: projectId, source='projects-module'

### Strategy Module Events
- [ ] Add Inngest handlers to `modules/strategy/inngest.ts`
  - [ ] Import `BaseEvent` and event types from `modules/events/schema`
  - [ ] Listen for `ProjectCreatedEvent`
  - [ ] Auto-generate initial plan when project created
  - [ ] Emit `PlanGeneratedEvent` after plan creation using `createEvent()` helper
  - [ ] Ensure type safety with TypeScript - event must match `BaseEvent` structure
- [ ] Update service layer to trigger events
  - [ ] Emit `PlanGeneratedEvent` in `storePlan()`
  - [ ] Pass required metadata: projectId, planId, source='strategy-module'

### Tasks Module (Foundation)
- [ ] Define Mongoose schema in `modules/tasks/schema.ts`
  - [ ] Task metadata (planId, projectId, createdAt)
  - [ ] Task type (blog_post, social_post, email_campaign, etc.)
  - [ ] Task details (title, description, content, target)
  - [ ] Status (pending, in_progress, review, completed, failed)
  - [ ] Priority level
  - [ ] Assigned channel
  - [ ] Performance metrics placeholder
- [ ] Create Zod validation schemas in `modules/tasks/validation.ts`
  - [ ] Task creation input
  - [ ] Task update input
  - [ ] Task output schema
- [ ] Implement service layer in `modules/tasks/service.ts`
  - [ ] `createTask(taskData)` - Create task
  - [ ] `updateTaskStatus(taskId, status)` - Update status
  - [ ] `getTasksByPlan(planId)` - Get all tasks for a plan
  - [ ] `getTasksByProject(projectId)` - Get all tasks for a project
- [ ] Add Inngest handlers to `modules/tasks/inngest.ts`
  - [ ] Listen for `plan.generated` event
  - [ ] Parse plan and create tasks
  - [ ] Emit `task.created` for each task
- [ ] Build API route in `app/api/tasks/route.ts`
  - [ ] GET /api/tasks?planId=X - List tasks
  - [ ] GET /api/tasks/:id - Get task
  - [ ] PATCH /api/tasks/:id - Update task status

### Event Orchestration Functions
- [ ] Create `inngest/functions/plan.generated.ts`
  - [ ] Import `PlanGeneratedEvent` and `InngestFunctionConfig` from types
  - [ ] Configure function with concurrency limit (e.g., 5 concurrent plan generations)
  - [ ] Type the Inngest function handler with proper event type
  - [ ] Handle `plan.generated` event
  - [ ] Use `event.metadata.idempotencyKey` to prevent duplicate task creation
  - [ ] Orchestrate task creation with same `correlationId`
  - [ ] Log event for debugging with metadata (eventId, correlationId, connectionId)
  - [ ] Handle retries gracefully (Inngest step memoization ensures completed steps don't re-run)
- [ ] Create `inngest/functions/task.created.ts`
  - [ ] Import `TaskCreatedEvent` and `InngestFunctionConfig` from types
  - [ ] Configure function with concurrency limit based on external API limits
  - [ ] Type the Inngest function handler with proper event type
  - [ ] Handle `task.created` event
  - [ ] Log task creation with correlation ID for tracing
  - [ ] Set up for future automation
  - [ ] Use idempotency for any database writes

### Logging & Monitoring
- [ ] Implement logger in `shared/utils/logger.ts`
  - [ ] Console logging for development
  - [ ] Structured logging (JSON)
  - [ ] Log levels (debug, info, warn, error)
  - [ ] Add request context to logs
- [ ] Add error classes in `shared/utils/errors.ts` (already exists, verify completeness)
  - [ ] Custom error types (ValidationError, NotFoundError, etc.)
  - [ ] Error serialization for API responses
- [ ] Set up event monitoring
  - [ ] Log all events passing through Inngest
  - [ ] Track event timing
  - [ ] Monitor event failures

#### Tasks Module Integration Tests
- [ ] Create test file: `tests/integration/tasks/tasks.test.ts`
  - [ ] Test: Create task via API (POST /api/tasks)
    - [ ] Verify task is saved to database
    - [ ] Verify task links to correct plan
  - [ ] Test: Get tasks by plan (GET /api/tasks?planId=X)
    - [ ] Verify all tasks for plan are returned
    - [ ] Verify filtering by status
  - [ ] Test: Update task status (PATCH /api/tasks/:id)
    - [ ] Verify status changes (pending → in_progress → review → completed)
  - [ ] Test: Get task by ID (GET /api/tasks/:id)
    - [ ] Verify access control

#### Inngest Integration Tests
- [ ] Create test file: `tests/integration/inngest/event-flow.test.ts`
  - [ ] Test: Complete event flow end-to-end
    - [ ] Create project → verify `project.created` event fires
    - [ ] Verify plan auto-generates from event
    - [ ] Verify `plan.generated` event fires
    - [ ] Verify tasks are created from plan
    - [ ] Verify `task.created` event fires for each task
    - [ ] Add generous timeout (3-5 minutes) for complete flow
  - [ ] Test: Event idempotency
    - [ ] Send duplicate `project.created` event
    - [ ] Verify only one plan is generated
    - [ ] Verify eventId deduplication works
  - [ ] Test: Error handling and retries
    - [ ] Simulate AI failure in plan generation
    - [ ] Verify retry logic kicks in
    - [ ] Verify error events are logged
  - [ ] Test: Event metadata and correlation
    - [ ] Verify correlationId traces across related events
    - [ ] Verify source and userId are preserved
- [ ] Create test file: `tests/integration/inngest/concurrency.test.ts`
  - [ ] Test: Concurrent project creation
    - [ ] Create multiple projects simultaneously
    - [ ] Verify concurrency limits are respected
    - [ ] Verify no race conditions in task creation

### v0.2 Success Criteria (Backend Only)
- [ ] Events flow end-to-end: project → plan → tasks
- [ ] All events are type-safe with BaseEvent
- [ ] Inngest functions are idempotent
- [ ] Event deduplication works correctly
- [ ] Concurrency limits prevent overload
- [ ] All integration tests passing
- [ ] Can observe events in Inngest dashboard (dev server)
- [ ] Error handling and retries work as expected
- [ ] Documentation updated with event patterns

---

## Phase v0.3 — Execution Agents (BACKEND ONLY)
**Goal:** Human-in-the-loop execution - Backend + Integration Tests ONLY

**Testing Philosophy:** All content generation agents must be validated via integration tests. Test AI content quality, agent reliability, and execution workflows.

### Content Agent
- [ ] Create content generation logic
  - [ ] Blog post generator (uses AI provider)
  - [ ] Social post generator (LinkedIn, X/Twitter)
  - [ ] Thread generator
  - [ ] Email copy generator
- [ ] Add content agent service
  - [ ] `generateBlogPost(topic, context)` - Generate blog
  - [ ] `generateSocialPost(topic, platform, context)` - Generate social content
  - [ ] `generateEmail(purpose, context)` - Generate email
- [ ] Update task execution to generate content
  - [ ] When task type is `blog_post`, call content agent
  - [ ] When task type is `social_post`, call content agent
  - [ ] Store generated content in task
  - [ ] Set status to `review`

### Social Agent (Draft Mode)
- [ ] Implement social post scheduling
  - [ ] LinkedIn API integration exploration
  - [ ] X (Twitter) API integration exploration
  - [ ] For v0.3: export as CSV/JSON for manual posting
- [ ] Add social service layer
  - [ ] `prepareSocialPost(content, platform)` - Format for platform
  - [ ] `exportForScheduling(posts)` - Export to Buffer/Hootsuite format

### Email Agent (Draft Mode)
- [ ] Research email provider APIs
  - [ ] Mailchimp API
  - [ ] SendGrid API
  - [ ] Postmark API
- [ ] For v0.3: generate email drafts only
  - [ ] Export as HTML
  - [ ] Export as plain text
  - [ ] Include subject lines and preview text

### CMS Integration (Research)
- [ ] Research Webflow API
  - [ ] Authentication flow
  - [ ] Blog post creation endpoint
  - [ ] Asset upload capabilities
- [ ] Research WordPress API
  - [ ] REST API authentication
  - [ ] Post creation endpoint
  - [ ] Media upload
- [ ] For v0.3: export as Markdown for manual posting

### Analytics Module (Foundation - BACKEND ONLY)
- [ ] Define Mongoose schema in `modules/analytics/schema.ts`
  - [ ] Metric data (projectId, taskId, timestamp)
  - [ ] Metric type (traffic, impressions, clicks, conversions)
  - [ ] Metric values
  - [ ] Source (GA4, Plausible, social platform)
  - [ ] Audit fields
- [ ] Create Zod validation schemas in `modules/analytics/validation.ts`
  - [ ] Metric recording input schema
  - [ ] Metric query schema
  - [ ] Metric response schema
- [ ] Implement service layer in `modules/analytics/service.ts`
  - [ ] Extend BaseService
  - [ ] `recordMetric(metricData)` - Store metric
  - [ ] `getMetrics(projectId, dateRange)` - Retrieve metrics with filtering
  - [ ] `analyzePerformance(projectId)` - Calculate summaries and aggregations
- [ ] Create repository in `modules/analytics/repository.ts`
  - [ ] Extend BaseRepository
  - [ ] Custom aggregation queries for performance summaries
- [ ] Build API routes in `app/api/analytics/`
  - [ ] POST /api/analytics - Record metric
  - [ ] GET /api/analytics?projectId=X - Get metrics with query parser
  - [ ] GET /api/analytics/summary?projectId=X - Get performance summaries

### Settings Module (BACKEND ONLY)
- [ ] Define Mongoose schema in `modules/settings/schema.ts`
  - [ ] Per-project automation settings (one-to-one with project)
  - [ ] Channel preferences (content, social, email, ads)
  - [ ] Automation level per channel (auto, review, off)
  - [ ] Notification preferences
  - [ ] Audit fields
- [ ] Create Zod validation schemas in `modules/settings/validation.ts`
  - [ ] Settings update schema
  - [ ] Settings response schema
- [ ] Implement service layer in `modules/settings/service.ts`
  - [ ] Extend BaseService
  - [ ] `getSettings(projectId)` - Get settings (create default if not exists)
  - [ ] `updateSettings(projectId, settings)` - Update settings
  - [ ] Default settings factory
- [ ] Create repository in `modules/settings/repository.ts`
  - [ ] Extend BaseRepository
- [ ] Build API routes in `app/api/settings/`
  - [ ] GET /api/settings?projectId=X - Get settings for project
  - [ ] PATCH /api/settings/:id - Update settings
  - [ ] Use withAuth, withDb, withValidation HOFs

### Execution Flow
- [ ] Wire task execution pipeline
  - [ ] Create API endpoint: POST /api/tasks/:id/execute
  - [ ] Call appropriate agent based on task type
  - [ ] Generate content using AI
  - [ ] Update task with content + set to `review`
  - [ ] Emit `task.executed` event via Inngest
- [ ] Add retry logic via Inngest
  - [ ] If content generation fails, retry 3 times with exponential backoff
  - [ ] If still fails, mark task as `failed`
  - [ ] Log errors for debugging

#### Content Generation Integration Tests
- [ ] Create test file: `tests/integration/content/blog-agent.test.ts`
  - [ ] Test: Generate blog post from task
    - [ ] Create test task with blog_post type
    - [ ] Execute task via API (POST /api/tasks/:id/execute)
    - [ ] Verify AI generates blog post content
    - [ ] Verify content includes title, body, meta description
    - [ ] Verify task status changes to `review`
    - [ ] Add 90-second timeout for content generation
  - [ ] Test: Content quality with different contexts
    - [ ] SaaS product blog post
    - [ ] E-commerce product blog post
    - [ ] Verify brand voice alignment
  - [ ] Test: Blog post regeneration
    - [ ] Request regeneration for same task
    - [ ] Verify new content is different
- [ ] Create test file: `tests/integration/content/social-agent.test.ts`
  - [ ] Test: Generate LinkedIn post
    - [ ] Create test task with social_post type (LinkedIn)
    - [ ] Execute task via API
    - [ ] Verify post respects character limits
    - [ ] Verify hashtags and formatting
  - [ ] Test: Generate Twitter/X post
    - [ ] Verify 280 character limit
    - [ ] Verify thread generation if needed
  - [ ] Test: Generate multiple social posts in batch
    - [ ] Verify concurrency handling
- [ ] Create test file: `tests/integration/content/email-agent.test.ts`
  - [ ] Test: Generate email campaign
    - [ ] Create test task with email_campaign type
    - [ ] Execute task via API
    - [ ] Verify email has subject line, preview text, body
    - [ ] Verify HTML and plain text versions
  - [ ] Test: Different email types
    - [ ] Newsletter
    - [ ] Product announcement
    - [ ] Nurture sequence

#### Execution Workflow Integration Tests
- [ ] Create test file: `tests/integration/execution/task-execution.test.ts`
  - [ ] Test: Complete execution workflow
    - [ ] Create project → generate plan → create tasks
    - [ ] Execute multiple tasks in sequence
    - [ ] Verify `task.executed` events fire
    - [ ] Verify all content is generated correctly
  - [ ] Test: Error handling during execution
    - [ ] Simulate AI failure
    - [ ] Verify retry logic
    - [ ] Verify task marked as failed after max retries
  - [ ] Test: Idempotency of task execution
    - [ ] Execute same task twice
    - [ ] Verify content not regenerated if already in review

#### Analytics Integration Tests
- [ ] Create test file: `tests/integration/analytics/metrics.test.ts`
  - [ ] Test: Record metrics via API (POST /api/analytics)
    - [ ] Record traffic metric
    - [ ] Record engagement metric
    - [ ] Verify metrics saved correctly
  - [ ] Test: Get metrics for project (GET /api/analytics?projectId=X)
    - [ ] Verify filtering by date range
    - [ ] Verify filtering by metric type
  - [ ] Test: Performance summary (GET /api/analytics/summary?projectId=X)
    - [ ] Verify aggregations are correct
    - [ ] Verify calculations for summaries

#### Settings Integration Tests
- [ ] Create test file: `tests/integration/settings/settings.test.ts`
  - [ ] Test: Get default settings for new project
    - [ ] Verify default settings are created
  - [ ] Test: Update settings (PATCH /api/settings/:id)
    - [ ] Update automation level for content channel
    - [ ] Verify settings persist
  - [ ] Test: Settings affect task execution
    - [ ] Disable automation for channel
    - [ ] Verify tasks respect settings

### v0.3 Success Criteria (Backend Only)
- [ ] Content generation agents work reliably
- [ ] Blog posts are 70%+ ready to publish
- [ ] Social posts respect platform constraints
- [ ] Email campaigns are well-formatted
- [ ] Task execution workflow is stable
- [ ] Retry and error handling work correctly
- [ ] All integration tests passing
- [ ] Can execute tasks end-to-end via API
- [ ] Analytics can record and retrieve metrics
- [ ] Settings control automation behavior
- [ ] Airstride content can be generated and evaluated
- [ ] Documentation updated with agent patterns and prompt strategies

---

## Environment Variables Needed

```bash
# Database
MONGODB_URI=

# Authentication
PROPELAUTH_AUTH_URL=
PROPELAUTH_API_KEY=
PROPELAUTH_VERIFIER_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Optional for v0.3+
MAILCHIMP_API_KEY=
SENDGRID_API_KEY=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
TWITTER_API_KEY=
TWITTER_API_SECRET=
```

---

## Frontend (Deferred - Build After Backend is Validated)

**Note:** All frontend work will begin AFTER v0.1, v0.2, and v0.3 backend + integration tests are complete and validated.

### v0.1 Frontend - Project & Strategy Management
- [ ] Create onboarding form page
  - [ ] Company information inputs
  - [ ] Product description textarea
  - [ ] ICP definition fields
  - [ ] Goals input (traffic, leads, revenue)
  - [ ] Brand voice settings
  - [ ] Website URL for AI research
  - [ ] Submit handler
- [ ] Create project list page
  - [ ] Display all projects for organization
  - [ ] Edit/delete actions
  - [ ] Create new project button
- [ ] Create plan view page
  - [ ] Display strategy pillars
  - [ ] Show 30-day calendar in table/timeline format
  - [ ] Display KPIs
  - [ ] JSON export option
  - [ ] Plan status indicator
  - [ ] Generate plan button

### v0.2 Frontend - Task Management
- [ ] Create task list dashboard
  - [ ] Display all tasks from active plan
  - [ ] Group by status (pending, in_progress, review, completed)
  - [ ] Show task details
  - [ ] Manual status update buttons
  - [ ] Execute task button
- [ ] Add event log viewer (optional)
  - [ ] Show recent events
  - [ ] Filter by event type
  - [ ] View event payloads

### v0.3 Frontend - Content Review & Approval
- [ ] Build task review interface
  - [ ] List tasks in `review` status
  - [ ] Display generated content
  - [ ] Edit content inline
  - [ ] Approve button → marks `completed`
  - [ ] Reject button → marks `failed`
  - [ ] Request regeneration button → re-runs content agent
- [ ] Add bulk actions
  - [ ] Approve multiple tasks
  - [ ] Reject multiple tasks
- [ ] Add preview modes
  - [ ] Preview blog post formatting
  - [ ] Preview social post with character counts
  - [ ] Preview email in inbox style
- [ ] Analytics dashboard
  - [ ] Display metrics charts
  - [ ] Performance summaries
  - [ ] Task performance tracking
- [ ] Settings page
  - [ ] Toggles for each channel
  - [ ] Automation level dropdowns (auto/review/off)
  - [ ] Save button

---

## Overall Success Metrics (Backend-First Approach)

### v0.1 Success (Backend Validated)
- [x] Projects API fully functional and tested
- [ ] Strategy API fully functional and tested
- [ ] AI website research works reliably (via integration tests)
- [ ] AI plan generation produces quality 30-day plans
- [ ] All integration tests passing (projects + strategy)
- [ ] Can test end-to-end via API calls (Postman/Insomnia/curl)
- [ ] Airstride project can be created via API
- [ ] Airstride 30-day plan can be generated via API
- [ ] Plan quality validated manually
- [ ] Documentation complete for API patterns

### v0.2 Success (Backend Validated)
- [ ] Events flow end-to-end: project → plan → tasks (tested via integration tests)
- [ ] All events are type-safe with BaseEvent
- [ ] Inngest functions are idempotent
- [ ] Event deduplication works correctly
- [ ] Concurrency limits prevent overload
- [ ] All integration tests passing (tasks + events)
- [ ] Can observe events in Inngest dashboard
- [ ] Error handling and retries work as expected
- [ ] Tasks created automatically from plan
- [ ] No manual intervention needed for task creation

### v0.3 Success (Backend Validated)
- [ ] Content generation agents work reliably (tested via integration tests)
- [ ] Blog posts are 70%+ ready to publish
- [ ] Social posts respect platform constraints
- [ ] Email campaigns are well-formatted
- [ ] Task execution workflow is stable
- [ ] All integration tests passing (content + execution)
- [ ] Can execute complete workflow via API: project → plan → tasks → content
- [ ] Analytics can record and retrieve metrics
- [ ] Settings control automation behavior
- [ ] Airstride content generated and evaluated for quality
- [ ] Foundation ready for frontend + full user workflows

### Frontend Phase Success (After Backend Complete)
- [ ] Users can onboard projects via UI
- [ ] Users can review and edit AI-generated plans
- [ ] Users can see task status and progress
- [ ] Users can review and approve generated content
- [ ] Users can view analytics and performance
- [ ] Users can configure settings per project
- [ ] Full user workflows validated with Airstride

---

## Notes

### Backend-First Development Philosophy
- **NO FRONTEND until backend is fully validated via integration tests**
- All modules (Projects, Strategy, Tasks, Content, Analytics, Settings) must have comprehensive integration tests
- Follow the test pattern in `tests/integration/ai/partner.research.test.ts`
- Use real AI providers in tests for true integration validation
- Test with generous timeouts (90-120 seconds for AI operations)
- Validate API contracts, data persistence, and business logic before building UI

### Testing Strategy
- Integration tests are the primary validation mechanism
- Test files should mirror the module structure (e.g., `tests/integration/projects/projects.test.ts`)
- Each test should be self-contained and create necessary test data
- Use descriptive test names that explain what is being validated
- Add console logging in tests to track progress and debug issues
- Test both happy paths and error scenarios

### Development Workflow
1. Build backend module (schema → validation → repository → service → API)
2. Write integration tests for all endpoints and workflows
3. Run tests and iterate until all pass
4. Manually test via API clients (Postman/Insomnia/curl)
5. Document learnings and API patterns
6. Move to next module
7. Only build frontend after ALL backend modules are complete and tested

### General Principles
- Focus on Airstride as the first real customer throughout all phases
- Prioritize learning over perfection in v0.1-0.3
- Document everything - you'll need it when adding autonomy
- Test event flows thoroughly - they're the foundation of autonomy
- Don't build integrations until v0.4+ unless needed for testing
- Keep the codebase modular and follow established architectural patterns

### AI-Powered Website Research (Context Ingestion)
- **Primary workflow:** User submits website URL → AI researches → Context auto-populated
- **AI Research Process:**
  - Use `generateStructuredOutputWithWebSearch()` from ai-sdk for intelligent web scraping
  - AI browses website, extracts company info, product details, brand voice
  - Structured output ensures consistent data format for database storage
  - Use temperature: TemperaturePreset.PRECISE (0.3) for factual extraction
  - Use model: AIModel.GEMINI_2_5_FLASH for cost-effective research
- **Research Quality:**
  - AI extracts factual data (company name, industry, products, social handles)
  - AI infers strategic data (ICP hints, business goals, brand voice)
  - Mark extracted vs inferred data differently in schema
  - Allow users to refine/override AI-extracted context
- **Fallback:** Support manual context entry if website research fails or is insufficient
- **Future Enhancement:** Could trigger research as Inngest background job for better UX
- **Cost Consideration:** Research per website is one-time cost, optimize prompts for accuracy

### TypeScript Event Pattern Enforcement
- **ALL Inngest events MUST extend `BaseEvent<TName, TData>`** - this is enforced at compile time
- Use the `createEvent()` helper function to ensure proper event structure
- Always include required metadata: `projectId` and `source`
- Event names use dot notation: `module.action` (e.g., 'project.created', 'plan.generated')
- Event versioning is built in (`version` field) for future backwards compatibility
- Use correlation IDs to trace related events across the system
- The TypeScript compiler will error if events don't match the base structure - this is intentional!

### Idempotency & Concurrency (Critical for Production)
- **Every event gets a unique `eventId`** - auto-generated if not provided, used for deduplication
- **Use `idempotencyKey`** for operations that must execute exactly once (e.g., charges, critical updates)
  - Format: `{projectId}:{eventType}:{resourceId}:{operation}`
  - Example: `proj_123:task:task_456:update`
- **Include `connectionId`** to track which client/session triggered the event (useful for concurrent users)
- **Set `correlationId`** to trace related events across a logical flow (e.g., project creation → plan generation → task creation)
- **Configure concurrency limits** per Inngest function based on:
  - External API rate limits (e.g., OpenAI has rate limits)
  - Database connection pool size
  - Resource constraints
- **Use `withIdempotency()` wrapper** for critical database operations that shouldn't be duplicated
- **Inngest automatically handles:**
  - Event deduplication (by eventId)
  - Step memoization (retries don't re-run completed steps)
  - Exponential backoff on failures
  - Automatic retries (default: 3 attempts)
- **Best Practices:**
  - Set concurrency limits on functions that call external APIs
  - Use debouncing for rapid-fire events (e.g., user typing)
  - Use rate limiting for user-triggered actions
  - Always design for retries - operations must be idempotent
  - Test with duplicate events to ensure idempotency works

