# Growthmind Modular Architecture

## Overview
Growthmind is an autonomous growth partner for startups, built on an event-driven architecture that evolves from manual advisor to fully autonomous growth system.

## Directory Structure

### 1. API Routes (app/api/)
Lightweight routes that handle HTTP requests and delegate to domain services.

- `app/api/projects/route.ts` - Project/company context management
- `app/api/strategy/route.ts` - Strategy plan generation
- `app/api/tasks/route.ts` - Task management and execution
- `app/api/analytics/route.ts` - Analytics and metrics
- `app/api/settings/route.ts` - User automation preferences
- `app/api/integrations/route.ts` - Integration management

### 2. Domain Modules (modules/)

#### Projects Module (`modules/projects/`)
Owns company context and onboarding data - the foundational "truth file" for all growth activities.

- `schema.ts` - Mongoose Project/Company model
- `validation.ts` - Zod schemas for onboarding context (company, ICP, goals, clients, revenue, campaigns)
- `service.ts` - createProject(), updateContext(), getProjectContext()
- `inngest.ts` - Emits 'project.created', 'context.updated'

**Data stored:**
- Company profile (name, industry, stage, website)
- Product description
- Ideal Customer Profile (ICP)
- Business goals (traffic, leads, revenue targets)
- Existing clients and revenue
- Brand voice and style guidelines
- Current campaigns
- Marketing assets (URLs, social handles)

#### Strategy Module (`modules/strategy/`)
Generates and stores growth strategy plans based on project context.

- `schema.ts` - Mongoose Plan model
- `validation.ts` - Zod schemas for Plan
- `service.ts` - generatePlan(), storePlan()
- `inngest.ts` - Emits 'plan.generated'

#### Tasks Module (`modules/tasks/`)
Manages execution units derived from plans.

- `schema.ts` - Mongoose Task model
- `validation.ts` - Zod schemas for Task
- `service.ts` - createTask(), updateTaskStatus()
- `inngest.ts` - Handles 'plan.generated' → creates tasks

#### Analytics Module (`modules/analytics/`)
Tracks performance metrics and feeds learning loops.

- `schema.ts` - Mongoose Analytics model
- `validation.ts` - Zod schemas for Analytics
- `service.ts` - analyzeMetrics(), feedBackIntoPlan()
- `inngest.ts` - Cron handlers for metrics ingestion

#### Events Module (`modules/events/`)
Defines the event schema that powers the autonomous system.

- `schema.ts` - Shared event schema definitions
- `registry.ts` - Exports all Inngest event types

**Core Events:**
- `project.created` - New company onboarded
- `context.updated` - Project context changed
- `plan.generated` - Strategy plan created
- `task.created` - Execution task spawned
- `task.executed` - Task completed
- `analytics.updated` - Metrics ingested

#### Settings Module (`modules/settings/`)
User automation preferences and control toggles.

- `schema.ts` - Mongoose Settings model
- `validation.ts` - Zod schemas for automation preferences
- `service.ts` - Settings business logic

**Automation Levels:**
- `auto` - Fully autonomous execution
- `review` - Generate and queue for approval
- `off` - Manual only

#### Integrations Module (`modules/integrations/`)
Manages external API connections and OAuth credentials.

- `schema.ts` - Integration, Account, Credential models
- `validation.ts` - Zod schemas for integration connections
- `service.ts` - connectIntegration(), refreshToken(), revokeIntegration()
- `inngest.ts` - Token refresh / connection events

**Supported Integrations:**
- Analytics: Google Analytics, Plausible
- CMS: Webflow, WordPress, Shopify
- Email: Mailchimp, SendGrid, Postmark
- Social: LinkedIn, X (Twitter), Instagram
- CRM: HubSpot, Airtable

#### OAuth2 Module (`modules/oauth2/`)
Shared OAuth2 authentication fabric (copied from existing project).

### 3. Shared Infrastructure (shared/)

#### Database (`shared/db/`)
- `connect.ts` - Mongoose connection helper

#### AI Provider (`shared/ai/`)
- `provider.ts` - AI abstraction layer (OpenAI, Anthropic, etc.)

#### Utilities (`shared/utils/`)
- `logger.ts` - Shared logging utility
- `errors.ts` - Custom error classes

#### Types (`shared/types/`)
- `index.ts` - Cross-module shared types

### 4. Inngest Configuration (inngest/)
Event orchestration and async workflows.

- `client.ts` - Inngest client instance
- `functions/planGenerated.ts` - Orchestrates downstream events
- `functions/taskCreated.ts` - Manages retries / analytics triggers

## Architecture Principles

### Event-Driven Design
Every action flows through events:
```
User onboards → project.created
→ Strategy generates plan → plan.generated
→ Tasks created → task.created
→ Tasks execute → task.executed
→ Analytics updated → analytics.updated
→ Strategy refines → plan.generated (next cycle)
```

### Layered Separation
- **API Routes** = I/O boundary (thin adapters)
- **Modules** = domain logic (thick business rules)
- **Shared** = cross-cutting concerns
- **Inngest** = async orchestration

### Data Flow
1. **Projects** stores company context
2. **Strategy** consumes context → generates plans
3. **Tasks** executes plan items
4. **Analytics** measures results
5. **Strategy** learns from analytics → refines next plan

### Automation Progression
- **v0.1-0.2:** Manual execution, AI advisory
- **v0.3-0.4:** Human-in-loop approval
- **v0.5-0.6:** Limited autopilot per channel
- **v0.7-1.0:** Full autonomous coordination

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Event Bus:** Inngest
- **Database:** MongoDB (Mongoose ODM)
- **Validation:** Zod v4
- **Auth:** PropelAuth
- **AI:** OpenAI, Anthropic (abstracted)
- **Hosting:** Vercel

## Development Roadmap

### v0.1 — Strategy Generator (~2 weeks)
Generate first 30-day plan (no automation)
- Context ingestion via Projects module
- Strategy generation
- JSON output

### v0.2 — Task Engine (~3 weeks)
Event-driven architecture foundation
- Inngest integration
- Event schema implementation
- Queue monitoring

### v0.3 — Execution Agents (~3 weeks)
Human-in-the-loop execution
- Content Agent (blogs, threads)
- Social Agent (LinkedIn/X)
- Task approval dashboard

### v0.4 — Analytics Loop (~2 weeks)
Close learning loop
- Analytics ingestion
- Daily summary events
- Strategy adjustment

### v0.5 — User Control (~2 weeks)
Custom automation settings
- Per-channel toggles
- PropelAuth integration
- Safe publishing pipeline

### v0.6 — Autopilot (~3 weeks)
Begin limited autonomy
- Auto channels enabled
- Daily orchestration
- CMS/social webhooks

### v0.7 — Multi-Agent (~3 weeks)
Parallelized task reasoning
- Central Strategy Brain
- Agent coordination
- Retry/failure logic

### v1.0 — Full Loop (~4 weeks)
Self-optimizing autonomy
- Fully automated cycle
- Explainable dashboard
- External API

## Key Design Decisions

### Why Modular Architecture?
- Each domain owns its schema, avoiding god-models
- Modules evolve independently
- Clear boundaries prevent tight coupling

### Why Event-Driven?
- Async by default (scale independently)
- Easy to add/remove automations
- Natural audit trail
- Supports gradual autonomy

### Why Zod + Mongoose?
- Zod: compile-time contracts + API validation
- Mongoose: runtime persistence + schema enforcement
- Best of both worlds

### Why Projects Module?
Strategy needs context to generate plans. Projects owns the "truth file" about the company, separating concerns from Settings (automation prefs) and Analytics (results tracking).

## Getting Started

1. Copy OAuth2 module from existing project → `modules/oauth2/`
2. Set up MongoDB connection in `shared/db/connect.ts`
3. Configure Inngest client in `inngest/client.ts`
4. Implement Projects schema + onboarding flow
5. Build Strategy generator with AI provider
6. Wire first event: `project.created` → `plan.generated`

---

**Built for:** Technical founders who want growth to run itself
**Philosophy:** "Founders shouldn't have to become marketers"

