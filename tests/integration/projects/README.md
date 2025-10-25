# Projects Module Integration Tests

Integration tests for the AI-powered website research and project management functionality.

## Overview

These tests verify that the Projects module's AI integration works correctly with real AI providers (Google Gemini). The focus is on testing the AI-powered features, not basic CRUD operations.

## Test Files

### `projects.research.test.ts`
Tests AI-powered website research functionality:
- ✅ Research real company websites (Airstride, Shopify, Vercel, Stripe)
- ✅ Extract company profile, product details, ICP, brand voice
- ✅ Handle non-existent/invalid websites gracefully
- ✅ Validate structured output schema
- ✅ Assess confidence scores (factual vs inferred)
- ✅ Create projects from website research
- ✅ Different company types (SaaS, E-commerce, Developer Tools)
- ⏱️ Performance monitoring (should complete in <60s)

## Running Tests

### Run All Projects Integration Tests
```bash
yarn test:integration:projects
```

### Run Specific Test File
```bash
npx jest tests/integration/projects/projects.research.test.ts
```

### Run with Verbose Output
```bash
npx jest tests/integration/projects --verbose
```

### Run in Watch Mode (for development)
```bash
npx jest tests/integration/projects --watch
```

## Requirements

### Environment Variables
Ensure you have the following environment variables set in `.env.local`:

```bash
# Required for AI operations
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key

# Required for database operations
MONGODB_URI=your_mongodb_connection_string

# Optional: Other AI providers
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### API Keys
- **Google Gemini**: Required (primary AI provider)
- **MongoDB**: Required (for project creation tests)
- **OpenAI/Anthropic**: Optional (for future provider testing)

## Test Companies

The tests use real, well-known companies to ensure reliable results:
- **Airstride** (`airstride.ai`) - Primary test case
- **Shopify** (`shopify.com`) - E-commerce platform
- **Vercel** (`vercel.com`) - Developer tools platform
- **Stripe** (`stripe.com`) - Payment processing

## Performance Expectations

### Expected Timings
- **Website Research (AI only)**: 30-60 seconds
- **Create Project from Website**: 40-70 seconds (AI + DB)
- **Multiple Company Research**: 60-120 seconds

### Timeout
All tests have a **90-second timeout** for AI operations. If any test takes longer than 60 seconds, a warning is logged.

### Performance Issues
If tests are timing out (>90s):
1. Check your network connection
2. Verify Google Gemini API key is valid
3. Check Google Gemini status (https://status.cloud.google.com)
4. Review the specific website being researched
5. Consider increasing timeout if needed

## Test Output

Tests provide detailed console logging:

```
🔍 Starting website research test for Airstride...
  Website: https://airstride.ai
✅ Research completed in 35.42s
  Company name: Airstride
  Industry: Technology / B2B SaaS
  Stage: seed
  Products: 4 features
  ICP target industries: 3
  Overall confidence: 0.78
  Factual confidence: 0.85
  Inferred confidence: 0.72

📊 Extracted Data Quality:
  Product description: ✓
  Features: 4 items
  ICP description: ✓
  Pain points: 3 items
  Brand voice tone: Professional
  Marketing assets: LinkedIn ✓
```

## What's NOT Tested Here

These are integration tests for AI-powered features. The following should be unit tests:
- ❌ Basic CRUD operations (create, read, update, delete)
- ❌ Database schema validation
- ❌ Field-level validations
- ❌ Error handling for invalid inputs
- ❌ Authorization/permission checks
- ❌ Response formatting

## Troubleshooting

### Common Issues

#### "Request timed out after 90 seconds"
- **Cause**: AI provider slow/unavailable or network issues
- **Solution**: Check Google Gemini status, retry test, check network

#### "Cannot find module '@/modules/projects'"
- **Cause**: TypeScript path mapping issue
- **Solution**: Ensure `jest.config.ts` has correct `moduleNameMapper`

#### "API key not found"
- **Cause**: Missing `GOOGLE_GENERATIVE_AI_API_KEY`
- **Solution**: Add key to `.env.local`

#### "Low confidence scores (<0.3)"
- **Cause**: Website has limited public information
- **Solution**: Expected behavior - test validates this scenario

#### "Schema validation failed"
- **Cause**: AI response doesn't match expected schema
- **Solution**: Check `AIExtractedContextSchema` in validation.ts

### Debug Mode

Run with detailed logging:
```bash
DEBUG=* npx jest tests/integration/projects --verbose
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Projects Integration Tests
  env:
    GOOGLE_GENERATIVE_AI_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
    MONGODB_URI: ${{ secrets.MONGODB_URI_TEST }}
  run: yarn test:integration:projects
  timeout-minutes: 10
```

### Skip in CI (if needed)
```bash
# Skip AI tests in CI due to API costs
npx jest --testPathIgnorePatterns=tests/integration/projects
```

## Cost Considerations

These integration tests make real API calls:
- **Google Gemini**: ~$0.01-0.03 per website research
- **MongoDB Atlas**: Free tier sufficient for tests

**Estimated cost per full test run**: ~$0.10-0.25

### Cost Optimization
- Run tests only when needed (not on every commit)
- Use Google Gemini (cheapest option)
- Mock AI calls in unit tests
- Set up billing alerts in Google Cloud Console

## Contributing

When adding new AI-powered project features:
1. Add corresponding integration test to this file
2. Follow existing test patterns
3. Set appropriate timeout (90s for AI operations)
4. Add performance logging
5. Test with real company websites
6. Update this README

## Support

If tests are consistently failing:
1. Check AI SDK documentation (`shared/ai-sdk/README.md`)
2. Verify schema definitions match prompts
3. Test `projectsService.researchWebsite()` in isolation
4. Check Google Gemini provider status
5. Review service layer implementation

---

**Last Updated**: January 2025
**AI Provider**: Google Gemini (Gemini 2.5 Flash)
**Test Framework**: Jest v30.2.0
**Related Modules**: `modules/projects`, `shared/ai-sdk`

