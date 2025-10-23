# Growthmind Development TODO List

## Phase v0.1 — Strategy Generator (~2 weeks)
**Goal:** Generate first 30-day plan (no automation)

### Database Setup
- [x] Set up MongoDB connection with `DatabaseService` in `shared/db/database.service.ts`
  - [x] Environment-specific connection pooling (dev/production/serverless)
  - [x] Connection helper with bounded retry logic
  - [x] Connection state logging and race condition prevention
  - [x] Model registry pattern for modular architecture
  - [x] Type-safe model registration with generics

### Projects Module (Context Ingestion)
- [ ] Define Mongoose schema in `modules/projects/schema.ts`
  - [ ] Company profile fields (name, industry, stage, website)
  - [ ] Product description
  - [ ] ICP (ideal customer profile)
  - [ ] Business goals (traffic, leads, revenue targets)
  - [ ] Existing clients and revenue data
  - [ ] Brand voice guidelines
  - [ ] Current campaigns
  - [ ] Marketing assets (URLs, social handles)
  - [ ] Research metadata (researchStatus, researchedAt, researchSource)
- [ ] Create Zod validation schemas in `modules/projects/validation.ts`
  - [ ] Website URL input validation (for AI research trigger)
  - [ ] AI-extracted context validation schema
  - [ ] Manual context override validation
  - [ ] Update context validation
  - [ ] Response schemas
- [ ] Implement AI research service in `modules/projects/service.ts`
  - [ ] `researchWebsite(websiteUrl)` - Use ai-sdk with web search to research company
    - [ ] Use `generateStructuredOutputWithWebSearch()` from ai-sdk
    - [ ] Extract company name, industry, stage, product description
    - [ ] Identify potential ICP based on website content
    - [ ] Extract social handles and marketing assets
    - [ ] Analyze brand voice from website content
    - [ ] Infer business goals from website messaging
  - [ ] `createProjectFromWebsite(websiteUrl, userId)` - Research + create project
    - [ ] Call `researchWebsite()` to get AI-extracted context
    - [ ] Store extracted data in Projects schema
    - [ ] Mark as AI-researched with metadata
    - [ ] Allow manual refinement later
  - [ ] `createProject(data)` - Create project with manual data
  - [ ] `getProjectContext(projectId)` - Retrieve project data
  - [ ] `updateContext(projectId, updates)` - Update project details
  - [ ] `refineContext(projectId, refinements)` - User refines AI-extracted data
- [ ] Build API route in `app/api/projects/route.ts`
  - [ ] POST /api/projects/research - Submit website URL for AI research
  - [ ] POST /api/projects - Create project (manual or from research)
  - [ ] GET /api/projects/:id - Get project
  - [ ] PATCH /api/projects/:id - Update project
  - [ ] POST /api/projects/:id/refine - Refine AI-extracted context

### Strategy Module (Plan Generation)
- [ ] Define Mongoose schema in `modules/strategy/schema.ts`
  - [ ] Plan metadata (projectId, createdAt, version)
  - [ ] Strategy pillars (narrative, channels, tactics)
  - [ ] 30-day content calendar
  - [ ] KPIs and success metrics
  - [ ] Status (draft, active, completed)
- [ ] Create Zod validation schemas in `modules/strategy/validation.ts`
  - [ ] Plan generation input
  - [ ] Plan output structure
- [ ] Build AI provider abstraction in `shared/ai/provider.ts`
  - [ ] Create base interface for AI providers
  - [ ] Implement OpenAI adapter
  - [ ] Implement Anthropic adapter
  - [ ] Add provider switching logic
  - [ ] Error handling and retries
- [ ] Implement service layer in `modules/strategy/service.ts`
  - [ ] `generatePlan(projectContext)` - Call AI to generate strategy
  - [ ] `storePlan(plan)` - Save plan to database
  - [ ] `getPlan(planId)` - Retrieve plan
  - [ ] Create comprehensive prompt template for 30-day plan
- [ ] Build API route in `app/api/strategy/route.ts`
  - [ ] POST /api/strategy/generate - Generate new plan
  - [ ] GET /api/strategy/:id - Get plan

### Frontend (Basic UI)
- [ ] Create onboarding form page
  - [ ] Company information inputs
  - [ ] Product description textarea
  - [ ] ICP definition fields
  - [ ] Goals input (traffic, leads, revenue)
  - [ ] Brand voice settings
  - [ ] Submit handler
- [ ] Create plan view page
  - [ ] Display strategy pillars
  - [ ] Show 30-day calendar in table/timeline format
  - [ ] Display KPIs
  - [ ] JSON export option
  - [ ] Plan status indicator

### Authentication
- [ ] Set up PropelAuth
  - [ ] Add PropelAuth configuration
  - [ ] Create auth middleware
  - [ ] Protect API routes
  - [ ] Add user context to requests

### Testing & Validation
- [ ] Test with Airstride as first customer
  - [ ] Input Airstride context manually
  - [ ] Generate first 30-day plan
  - [ ] Review plan quality
  - [ ] Iterate on prompt engineering
- [ ] Document learnings for v0.2

---

## Phase v0.2 — Task Engine (~3 weeks)
**Goal:** Event-driven architecture foundation

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
- [ ] Add error classes in `shared/utils/errors.ts`
  - [ ] Custom error types (ValidationError, NotFoundError, etc.)
  - [ ] Error serialization for API responses
- [ ] Set up event monitoring
  - [ ] Log all events passing through Inngest
  - [ ] Track event timing
  - [ ] Monitor event failures

### Frontend Updates
- [ ] Create task list dashboard
  - [ ] Display all tasks from active plan
  - [ ] Group by status (pending, review, completed)
  - [ ] Show task details
  - [ ] Manual status update buttons
- [ ] Add event log viewer (optional)
  - [ ] Show recent events
  - [ ] Filter by event type
  - [ ] View event payloads

### Testing
- [ ] Test complete event flow
  - [ ] Create project → verify `project.created` fires
  - [ ] Verify plan auto-generates
  - [ ] Verify `plan.generated` fires
  - [ ] Verify tasks are created
  - [ ] Verify `task.created` fires for each task
- [ ] Test error handling
  - [ ] What happens if AI fails?
  - [ ] What happens if event fails?
  - [ ] Retry logic verification

---

## Phase v0.3 — Execution Agents (~3 weeks)
**Goal:** Human-in-the-loop execution

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

### Task Approval Dashboard
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

### Analytics Module (Foundation)
- [ ] Define Mongoose schema in `modules/analytics/schema.ts`
  - [ ] Metric data (projectId, taskId, timestamp)
  - [ ] Metric type (traffic, impressions, clicks, conversions)
  - [ ] Metric values
  - [ ] Source (GA4, Plausible, social platform)
- [ ] Create Zod validation schemas in `modules/analytics/validation.ts`
- [ ] Implement service layer in `modules/analytics/service.ts`
  - [ ] `recordMetric(metricData)` - Store metric
  - [ ] `getMetrics(projectId, dateRange)` - Retrieve metrics
  - [ ] `analyzePerformance(projectId)` - Calculate summaries
- [ ] Build API route in `app/api/analytics/route.ts`
  - [ ] POST /api/analytics - Record metric
  - [ ] GET /api/analytics?projectId=X - Get metrics
- [ ] Add manual metric input (for v0.3)
  - [ ] Form to enter traffic/engagement data
  - [ ] Associate with tasks

### Settings Module
- [ ] Define Mongoose schema in `modules/settings/schema.ts`
  - [ ] Per-project automation settings
  - [ ] Channel preferences (content, social, email, ads)
  - [ ] Automation level per channel (auto, review, off)
  - [ ] Notification preferences
- [ ] Create Zod validation schemas in `modules/settings/validation.ts`
- [ ] Implement service layer in `modules/settings/service.ts`
  - [ ] `getSettings(projectId)` - Get settings
  - [ ] `updateSettings(projectId, settings)` - Update settings
- [ ] Build API route in `app/api/settings/route.ts`
  - [ ] GET /api/settings?projectId=X - Get settings
  - [ ] PATCH /api/settings/:id - Update settings
- [ ] Build settings UI
  - [ ] Toggles for each channel
  - [ ] Automation level dropdowns (auto/review/off)
  - [ ] Save button

### Execution Flow
- [ ] Wire task execution pipeline
  - [ ] Listen for manual "execute task" trigger
  - [ ] Call appropriate agent based on task type
  - [ ] Generate content
  - [ ] Update task with content + set to `review`
  - [ ] Emit `task.executed` event
- [ ] Add retry logic
  - [ ] If content generation fails, retry 3 times
  - [ ] If still fails, mark task as `failed`
  - [ ] Log errors for debugging

### Testing with Airstride
- [ ] Generate tasks from plan
- [ ] Execute tasks to generate content
  - [ ] Generate 2-3 blog posts
  - [ ] Generate 5-10 social posts
  - [ ] Generate 1 email campaign
- [ ] Review content quality
  - [ ] Is it on-brand?
  - [ ] Is it accurate?
  - [ ] Does it need heavy editing?
- [ ] Iterate on prompts and content generation
- [ ] Manually publish content and track results
- [ ] Record metrics in analytics module

### Documentation
- [ ] Update ARCHITECTURE_PLAN.md with learnings
- [ ] Document common issues and solutions
- [ ] Create guide for adding new task types
- [ ] Prepare for v0.4 (analytics feedback loop)

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

## Success Metrics

### v0.1 Success
- [ ] Can onboard Airstride with full context
- [ ] Can generate coherent 30-day plan
- [ ] Plan includes strategy pillars, content calendar, and KPIs
- [ ] Plan is stored in database
- [ ] Plan is displayed in UI

### v0.2 Success
- [ ] Events flow end-to-end: project created → plan generated → tasks created
- [ ] All events are logged and visible
- [ ] Tasks are created automatically from plan
- [ ] Task dashboard shows all tasks
- [ ] No manual intervention needed for task creation

### v0.3 Success
- [ ] Can generate blog post content from task
- [ ] Can generate social post content from task
- [ ] Content quality is 70%+ ready to publish
- [ ] Approval workflow works smoothly
- [ ] Can manually publish 1 piece of content and record metrics
- [ ] Foundation ready for automation in v0.4+

---

## Notes

- Focus on Airstride as the first real customer throughout all phases
- Prioritize learning over perfection in v0.1-0.3
- Keep UI minimal and functional - aesthetics come later
- Document everything - you'll need it when adding autonomy
- Test event flows thoroughly - they're the foundation of autonomy
- Don't build integrations until v0.4+ unless needed for testing

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

