# Projects Module - AI-Powered Context Ingestion

## Overview

The Projects Module is the foundational "truth file" for Growthmind. It uses AI to automatically research and extract company context from website URLs, enabling rapid onboarding without manual data entry.

## Domain Model

**Project** = Persistent company/product context
- ONE per company/product
- Contains: company profile, product details, ICP, brand voice, business goals
- Long-lived, rarely changes
- Serves as the foundation for all growth strategies

**Campaign** (Future - v0.3+)
- Time-bound growth initiatives
- Multiple campaigns per project
- Each with specific goals, voice overrides, and date ranges
- Examples: product launch, feature release, SEO campaign

## Architecture

### Files Structure

```
modules/projects/
├── schema.ts          # Mongoose schema + model registration
├── validation.ts      # Zod validation schemas
├── service.ts         # ProjectsService (extends BaseService)
└── README.md         # This file

app/api/projects/
├── route.ts          # POST (create), GET (list)
├── research/
│   └── route.ts      # POST (AI research only)
└── [id]/
    ├── route.ts      # GET, PATCH, DELETE (by ID)
    └── refine/
        └── route.ts  # POST (refine AI data)
```

## AI Research Flow

### How It Works

1. **User Input**: Provides website URL
2. **AI Research**: Uses `generateStructuredOutputWithWebSearch()` from ai-sdk
   - Provider: Google Gemini 2.5 Flash
   - Temperature: PRECISE (0.3) for factual extraction
   - Web search enabled for comprehensive data gathering
3. **Data Extraction**:
   - **Factual**: Company name, industry, features, social handles
   - **Inferred**: ICP, brand voice, business goals
4. **Confidence Scoring**: Returns 0-1 scores for overall, factual, and inferred data
5. **Storage**: Saves to MongoDB with research metadata

### Research Prompt Strategy

The AI prompt is engineered to:
- Extract factual data with high confidence
- Infer strategic insights (ICP, goals, voice)
- Analyze brand tone, style, and messaging
- Handle missing data gracefully
- Return confidence scores for quality assessment

## API Endpoints

### 1. Research Website (AI Only)

```http
POST /api/projects/research
```

**Request:**
```json
{
  "websiteUrl": "https://example.com",
  "userId": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedContext": {
      "company": { "name": "...", "industry": "..." },
      "product": { "description": "...", "features": [...] },
      "icp": { "description": "...", "painPoints": [...] },
      "businessGoals": { "leadsTarget": 1000 },
      "brandVoice": { "tone": "professional", "style": "..." },
      "marketingAssets": { "linkedinUrl": "...", "twitterUrl": "..." },
      "confidence": {
        "overall": 0.85,
        "factual": 0.95,
        "inferred": 0.75
      }
    },
    "websiteUrl": "https://example.com",
    "researchedAt": "2025-01-15T10:30:00Z"
  }
}
```

### 2. Create Project from Website (AI-Powered)

```http
POST /api/projects
```

**Request:**
```json
{
  "websiteUrl": "https://example.com",
  "userId": "user_123",
  "organizationId": "org_456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "proj_789",
      "company": { ... },
      "researchMetadata": {
        "status": "completed",
        "source": "ai",
        "confidence": 0.85
      }
    }
  }
}
```

### 3. Create Project Manually

```http
POST /api/projects
```

**Request:**
```json
{
  "company": {
    "name": "Acme Corp",
    "industry": "SaaS",
    "stage": "seed",
    "website": "https://acme.com"
  },
  "product": { ... },
  "userId": "user_123"
}
```

### 4. Get Project

```http
GET /api/projects/:id
```

### 5. Update Project

```http
PATCH /api/projects/:id
```

### 6. Refine AI-Extracted Context

```http
POST /api/projects/:id/refine
```

**Use Case**: User reviews AI-extracted data and provides corrections

**Request:**
```json
{
  "company": {
    "stage": "series-a"  // Override AI inference
  },
  "icp": {
    "painPoints": ["updated pain point"]
  },
  "refinementNotes": "Corrected stage and added specific pain point"
}
```

### 7. List Projects

```http
GET /api/projects?userId=user_123
GET /api/projects?organizationId=org_456
```

## Service Layer Methods

### ProjectsService (extends BaseService)

#### AI Research
- `researchWebsite(websiteUrl)` - AI-powered website research
- `createProjectFromWebsite(input)` - Research + create in one step

#### CRUD Operations
- `createProject(data)` - Manual project creation
- `getProjectContext(projectId)` - Get single project
- `updateContext(projectId, updates)` - Update project
- `refineContext(projectId, refinements)` - User-guided refinement
- `findProjectsByUser(userId)` - List user's projects
- `findProjectsByOrganization(orgId)` - List org's projects

## Schema

### Key Fields

```typescript
interface IProject {
  // Company profile
  company: {
    name: string;
    industry?: string;
    stage?: CompanyStage;
    website: string;
    description?: string;
  };

  // Product
  product: {
    description?: string;
    features?: string[];
    valueProposition?: string;
  };

  // Ideal Customer Profile
  icp: {
    description?: string;
    painPoints?: string[];
    demographics?: string;
    targetCompanySize?: string;
    targetIndustries?: string[];
  };

  // Business Goals
  businessGoals: {
    trafficTarget?: number;
    leadsTarget?: number;
    revenueTarget?: number;
    demoTarget?: number;
    other?: string[];
  };

  // Brand Voice
  brandVoice: {
    tone?: string;
    style?: string;
    keywords?: string[];
    guidelines?: string;
  };

  // Marketing Assets
  marketingAssets: {
    linkedinUrl?: string;
    twitterUrl?: string;
    blogUrl?: string;
    // ... other platforms
  };

  // Research Metadata
  researchMetadata: {
    status: 'pending' | 'completed' | 'failed' | 'manual';
    source: 'ai' | 'manual' | 'mixed';
    researchedAt?: Date;
    confidence?: number; // 0-1
    factualConfidence?: number;
    inferredConfidence?: number;
    researchNotes?: string;
  };

  // User tracking
  userId: string;
  organizationId?: string;
}
```

## Usage Examples

### Example 1: AI-Powered Onboarding

```typescript
// Step 1: Research website
const research = await fetch('/api/projects/research', {
  method: 'POST',
  body: JSON.stringify({
    websiteUrl: 'https://airstride.ai',
    userId: currentUserId
  })
});

// Step 2: Review AI-extracted data
const { extractedContext, confidence } = research.data;

// Step 3: Create project (optional refinements)
const project = await fetch('/api/projects', {
  method: 'POST',
  body: JSON.stringify({
    websiteUrl: 'https://airstride.ai',
    userId: currentUserId
  })
});
```

### Example 2: Manual Entry

```typescript
const project = await fetch('/api/projects', {
  method: 'POST',
  body: JSON.stringify({
    company: {
      name: 'My Startup',
      industry: 'B2B SaaS',
      stage: 'pre-seed',
      website: 'https://mystartup.com'
    },
    product: {
      description: 'AI-powered analytics platform'
    },
    userId: currentUserId
  })
});
```

### Example 3: Refine AI Data

```typescript
const refined = await fetch(`/api/projects/${projectId}/refine`, {
  method: 'POST',
  body: JSON.stringify({
    company: {
      stage: 'seed' // Correct AI inference
    },
    icp: {
      painPoints: [
        'Manual data analysis is time-consuming',
        'Lack of real-time insights'
      ]
    },
    refinementNotes: 'Updated stage and clarified ICP pain points'
  })
});
```

## Research Quality

### Confidence Scores

- **0.8 - 1.0**: High quality - AI is very confident
- **0.5 - 0.8**: Medium quality - Review recommended
- **0.0 - 0.5**: Low quality - Manual review required

### Research Sources

- **ai**: Fully AI-extracted (no human input)
- **manual**: Manually entered (no AI)
- **mixed**: AI-extracted with user refinements

## Environment Variables Required

```bash
# Required for AI research
GOOGLE_GENERATIVE_AI_API_KEY=...
# OR
OPENAI_API_KEY=...
# OR
ANTHROPIC_API_KEY=...

# Database
MONGODB_URI=...
MONGODB_DATABASE_NAME=...
```

## Testing

### Test with Airstride (First Customer)

```bash
# 1. Research Airstride
curl -X POST http://localhost:3000/api/projects/research \
  -H "Content-Type: application/json" \
  -d '{
    "websiteUrl": "https://airstride.ai",
    "userId": "test_user_123"
  }'

# 2. Create project from research
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "websiteUrl": "https://airstride.ai",
    "userId": "test_user_123"
  }'
```

## Next Steps (v0.2+)

1. **Event Emission**: Emit `project.created` event when project is created
2. **Strategy Generation**: Trigger automatic strategy generation on project creation
3. **Campaigns Layer**: Add Campaigns module for multiple concurrent initiatives per project

## Notes

- Projects are soft-deleted (isDeleted flag) for data retention
- Research metadata tracks confidence levels for quality assessment
- AI extraction is optimized for B2B SaaS companies (adjust prompt for other verticals)
- Users can always override AI data via refinement endpoint

