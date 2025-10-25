# How to Run Projects Integration Tests

Quick guide to running the AI-powered website research integration tests.

## Prerequisites

### 1. Install Dependencies
```bash
yarn install
```

### 2. Set Up Environment Variables

Create or update `.env.local` in the project root:

```bash
# Required: Google Gemini API Key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here

# Required: MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/growthmind-dev
# OR use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/growthmind

# Optional: Other AI Providers
OPENAI_API_KEY=your_openai_key (optional)
ANTHROPIC_API_KEY=your_anthropic_key (optional)
```

### 3. Get Google Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key to your `.env.local`

## Running Tests

### Quick Test (Single Test File)
```bash
yarn test:integration:projects
```

### Run with Detailed Output
```bash
npx jest tests/integration/projects --verbose
```

### Run Specific Test
```bash
# Run only the Airstride test
npx jest tests/integration/projects -t "should successfully research airstride.ai"

# Run only website research tests
npx jest tests/integration/projects -t "AI Website Research"
```

### Watch Mode (for development)
```bash
npx jest tests/integration/projects --watch
```

## Expected Output

When tests run successfully, you should see output like this:

```
 PASS  tests/integration/projects/projects.research.test.ts (45.231 s)
  Project Website Research Integration Test
    AI Website Research
      🔍 Starting website research test for Airstride...
        Website: https://airstride.ai
      ✅ Research completed in 35.42s
        Company name: Airstride
        Industry: Technology / AI
        Stage: seed
        Products: 4 features
        ICP target industries: 3
        Overall confidence: 0.78
        Factual confidence: 0.85
        Inferred confidence: 0.72
      ✓ should successfully research airstride.ai and extract company context (35451 ms)
      
      🔍 Testing SaaS company research (Shopify)...
      ✅ Shopify research completed in 28.12s
        Company name: Shopify
        Industry: E-commerce
        Products: 8 features
        Overall confidence: 0.92
      ✓ should research a well-known SaaS company (Shopify) (28234 ms)
      
    Create Project from Website Research
      🚀 Creating project from website research...
        Website: https://airstride.ai
        User: test-user-123
      ✅ Project created in 42.67s
        Project ID: 67a1b2c3d4e5f6g7h8i9j0k1
        Company: Airstride
        Website: https://airstride.ai
        Research source: ai
        Research status: researched
        Confidence: 0.78
        
      📊 Extracted Data Quality:
        Product description: ✓
        Features: 4 items
        ICP description: ✓
        Pain points: 3 items
        Brand voice tone: Professional
        Marketing assets: LinkedIn ✓
      ✓ should create project from airstride.ai website research (42781 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        106.341 s
```

## What Each Test Does

### 1. Website Research Tests
- ✅ **Airstride Test**: Researches airstride.ai, validates all fields
- ✅ **Shopify Test**: Tests with well-known SaaS company
- ✅ **Invalid Website Test**: Tests error handling

### 2. Project Creation Tests
- ✅ **Create from Research**: Full workflow (AI research → DB save)
- ✅ **Multiple Companies**: Tests different industry types

### 3. Quality Tests
- ✅ **Schema Validation**: Ensures AI output matches expected structure
- ✅ **Confidence Scoring**: Validates confidence metrics

## Troubleshooting

### Test Fails with "API key not found"
```bash
# Check your .env.local file
cat .env.local | grep GOOGLE_GENERATIVE_AI_API_KEY

# Make sure the key is valid (no quotes or extra spaces)
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...your_key_here
```

### Test Timeout
```bash
# Increase timeout for specific test
# Edit the test file and change:
TEST_TIMEOUT = 120000  # 2 minutes instead of 90 seconds
```

### MongoDB Connection Failed
```bash
# Make sure MongoDB is running locally
mongod --version

# Or check Atlas connection string
# Ensure IP whitelist is configured
```

### Module Import Errors
```bash
# Rebuild node_modules
rm -rf node_modules
yarn install

# Check tsconfig.json paths are correct
```

## Performance Tips

### Reduce Test Time
```bash
# Run only specific tests during development
npx jest tests/integration/projects -t "airstride"

# Skip slow tests
npx jest tests/integration/projects --testNamePattern="^(?!.*multiple companies).*"
```

### Parallel Execution
```bash
# Run tests in parallel (be careful with API rate limits)
yarn test:integration:projects --maxWorkers=2
```

## Next Steps

After tests pass:
1. ✅ Review test output logs
2. ✅ Check extracted data quality
3. ✅ Validate confidence scores are reasonable
4. ✅ Test with your own company website
5. ✅ Move on to building the Strategy module

## Custom Test with Your Company

Want to test with your own company website?

```typescript
it("should research MY_COMPANY website", async () => {
  const websiteUrl = "https://yourcompany.com";
  
  const result = await projectsService.researchWebsite(websiteUrl);
  
  console.log("Company:", result.company.name);
  console.log("Industry:", result.company.industry);
  console.log("Confidence:", result.confidence.overall);
  
  expect(result.company.name).toBeDefined();
}, 90000);
```

## Questions?

- Check `README.md` for detailed documentation
- Review `projects.research.test.ts` for test implementation
- Check `modules/projects/application/service.ts` for service logic
- See `shared/ai-sdk/` for AI provider configuration

---

Happy Testing! 🚀

