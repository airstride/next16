# Subscriptions Module Implementation Status

## ✅ Completed

### 1. Subscriptions Module Created
Following the same schema-first architecture as projects module:

**Files Created:**
- ✅ `modules/subscriptions/infrastructure/schema.ts` - Mongoose schema with snake_case
- ✅ `modules/subscriptions/domain/types.ts` - Domain interfaces and enums  
- ✅ `modules/subscriptions/domain/tier-limits.ts` - Tier configuration and limits
- ✅ `modules/subscriptions/api/validation.ts` - Zod schemas for API
- ✅ `modules/subscriptions/api/response.ts` - Response DTOs
- ✅ `modules/subscriptions/api/query.config.ts` - Query parser config
- ✅ `modules/subscriptions/application/factory.ts` - Data transformations
- ✅ `modules/subscriptions/application/service.ts` - Business logic with payment walls
- ✅ `modules/subscriptions/index.ts` - Barrel export with proper boundaries
- ✅ `modules/subscriptions/inngest.ts` - Event handlers placeholder

### 2. Payment Wall Middleware
- ✅ `shared/api/hofs/withSubscription.ts` - HOF for subscription checks
- ✅ Exported from `shared/api/index.ts`

### 3. Routes Updated (3 of 11)
- ✅ `app/api/auth/orgs/route.ts` - GET/POST using authService + subscriptions
- ✅ `app/api/auth/orgs/[id]/route.ts` - GET/PATCH/DELETE using authService
- ✅ `app/api/auth/invite-user/route.ts` - Simplified to use authService

## ⏳ In Progress

### Routes Still Need Updating (8 remaining):

1. `app/api/auth/revoke-invite/route.ts`
2. `app/api/auth/users/[id]/role/route.ts`
3. `app/api/auth/users/[id]/route.ts`
4. `app/api/auth/users/route.ts`
5. `app/api/auth/orgs/[id]/users/route.ts`
6. `app/api/auth/orgs/[id]/invitees/route.ts`
7. `app/api/auth/orgs/[id]/ai/route.ts`
8. `app/api/auth/orgs/[id]/bulk/route.ts`

**Pattern for Updates:**
- Remove: `import { organisationService } from "@/services/organisation.service";`
- Add: `import * as authService from "@/shared/auth/auth.service";`
- Replace organisationService calls with authService calls
- Remove withDB wrapper if only calling PropelAuth (no database needed)

## 📋 Next Steps

### 1. Finish Route Updates
Complete the remaining 8 routes with the same pattern.

### 2. Add Payment Walls to Protected Routes
Identify routes that need tier restrictions and add `withSubscription`:

```typescript
// Example: AI research feature (PRO tier)
export const POST = withAuth(
  withDB(
    withSubscription({ requiredFeature: 'ai_research' })(
      withValidation(schema, async (req, params, { subscription }) => {
        // Check limits before creating
        const canCreate = await subscriptionsService.checkLimit(
          subscription.propel_auth_org_id,
          'projects'
        );
        
        if (!canCreate) {
          return PaymentRequiredResponse("Project limit reached");
        }
        
        // Create resource
        // Increment usage
        await subscriptionsService.incrementUsage(
          subscription.propel_auth_org_id,
          'projects'
        );
      })
    )
  )
);
```

### 3. Create Subscription API Routes (Optional)
If you want admin/user-facing subscription management:

**Create:**
- `app/api/subscriptions/route.ts` - GET subscription for current org
- `app/api/subscriptions/[id]/route.ts` - Update subscription tier
- `app/api/subscriptions/usage/route.ts` - Get current usage
- `app/api/subscriptions/features/route.ts` - Check feature access

### 4. Seed Initial Subscriptions
Create script to initialize free tier subscriptions for existing orgs:

```typescript
// scripts/seed-subscriptions.ts
import * as authService from "@/shared/auth/auth.service";
import { subscriptionsService, SubscriptionTier } from "@/modules/subscriptions";

async function seedSubscriptions() {
  // Get all orgs from PropelAuth
  const orgs = await authService.getOrganisations();
  
  for (const org of orgs.orgs) {
    // Check if subscription exists
    const existing = await subscriptionsService.getByOrganization(org.orgId);
    
    if (!existing) {
      // Create free tier subscription
      await subscriptionsService.createForOrganization(
        org.orgId,
        SubscriptionTier.FREE,
        "system", // system user
        14 // 14 day trial
      );
      console.log(`Created subscription for org: ${org.name}`);
    }
  }
}
```

### 5. Integration with Projects Module
Update projects routes to check limits:

```typescript
// app/api/projects/route.ts
export const POST = withAuth(
  withDB(
    withSubscription()(
      withValidation(CreateProjectSchema, async (req, params, { auth, body, subscription }) => {
        // Check project limit
        const withinLimit = await subscriptionsService.checkLimit(
          auth.activeOrgId,
          'projects'
        );
        
        if (!withinLimit) {
          return NextResponse.json({
            error: "Project limit reached",
            message: "Upgrade your subscription to create more projects",
            limit: subscription.limits?.projects,
            current: subscription.usage.projects_count
          }, { status: 402 });
        }
        
        // Create project
        const project = await projectsService.createProject(body, auth.userId, auth.activeOrgId);
        
        // Increment usage
        await subscriptionsService.incrementUsage(auth.activeOrgId, 'projects');
        
        return NextResponse.json(project, { status: 201 });
      })
    )
  )
);
```

### 6. Stripe Integration (Future)
- Webhook handler for subscription events
- Update subscription status on payment success/failure
- Handle trial expiration
- Sync subscription changes from Stripe

## 🎯 Architecture Benefits

### What We Achieved:
✅ **No duplication** - PropelAuth manages org data, we only store subscription info
✅ **Minimal module** - Only subscription/billing logic, nothing else
✅ **Payment walls** - Tier-based access control via middleware
✅ **Usage tracking** - Monitor limits per organization
✅ **Schema-first** - Follows projects module pattern perfectly
✅ **Type-safe** - snake_case throughout, TypeScript enforces boundaries

### Key Design Decisions:
1. **PropelAuth org ID as foreign key** - `propel_auth_org_id` links subscriptions to orgs
2. **Unique constraint** - One subscription per organization
3. **Free tier default** - All orgs start on free tier
4. **Trial management** - Automatic trial period with expiration
5. **Usage tracking** - Counters for projects, users, API calls, storage
6. **Flexible limits** - `-1` means unlimited (for enterprise tier)
7. **Feature flags** - String array of enabled features per tier

## 📊 Testing Checklist

### Unit Tests:
- [ ] Subscription creation with different tiers
- [ ] Limit checking (within/exceeded)
- [ ] Feature access checks
- [ ] Usage increment operations
- [ ] Trial expiration logic

### Integration Tests:
- [ ] Create org → free subscription created automatically
- [ ] withSubscription middleware blocks requests correctly
- [ ] Upgrade tier → limits updated
- [ ] Exceed limit → 402 Payment Required returned

### Manual Testing:
1. Create organization
2. Verify free tier subscription created
3. Create project (should work - within limit)
4. Try to create 2nd project on free tier (should fail - limit reached)
5. Upgrade to starter tier
6. Create 2nd project (should work now)
7. Check usage counters updated correctly

## 🚀 Production Readiness

### Before Going Live:
- [ ] Complete all route updates
- [ ] Add payment walls to sensitive features
- [ ] Seed subscriptions for existing orgs
- [ ] Add Stripe integration
- [ ] Set up trial expiration cron job (Inngest)
- [ ] Add monitoring/alerts for subscription errors
- [ ] Document tier limits for users
- [ ] Create upgrade flow UI

