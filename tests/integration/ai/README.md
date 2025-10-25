# AI SDK Integration Tests

Comprehensive integration tests for all AI-powered features in the application.

## Overview

These tests verify that the AI SDK migration is working correctly by testing real AI operations with actual providers (Google Gemini). Each test has a 90-second timeout to catch performance issues.

## Test Suites

### 1. Partner Research (`partner.research.test.ts`)
Tests comprehensive partner research with web search:
- ✅ Research real companies with full intelligence extraction
- ✅ Handle defunct/non-existent companies gracefully
- ✅ Validate response structure (success vs error format)
- ⏱️ Performance monitoring (should complete in <60s)

### 2. Vendor Research (`vendor.research.test.ts`)
Tests vendor business intelligence extraction:
- ✅ Extract company profile, products, and categories
- ✅ Identify tech stack and target industries
- ✅ Validate focused regions and market data
- ⏱️ Performance monitoring

### 3. Joint Partnership Analysis (`joint.analysis.test.ts`)
Tests strategic partnership analysis:
- ✅ Generate joint value propositions
- ✅ Identify key synergies and competitive advantages
- ✅ Assess partnership readiness and integration complexity
- ✅ Analyze market expansion opportunities

### 4. Filter Generation (`filter.generation.test.ts`)
Tests natural language to database filter conversion:
- ✅ Convert user queries to structured filters
- ✅ Handle simple and complex multi-criteria queries
- ✅ Map to correct database fields and values
- ⚡ Fast execution (no web search needed)

### 5. Outreach Messages (`outreach.test.ts`)
Tests personalized outreach message generation:
- ✅ Generate professional, personalized messages
- ✅ Include contact name and company context
- ✅ Ensure message uniqueness across contacts
- ⚡ Fast execution

### 6. Partner Scoring (`scoring.test.ts`)
Tests partner fit scoring from existing data:
- ✅ Score partners across 12 criteria (0-82 points)
- ✅ Assign appropriate fit tier (GOLD/SILVER/BRONZE/NOT_A_MATCH)
- ✅ Validate confidence scores and evidence
- ✅ Handle low-data scenarios appropriately

### 7. Profile Enrichment (`enrichment.test.ts`)
Tests lightweight profile data enrichment:
- ✅ Fill missing profile fields with web search
- ✅ Respect existing data (only fill gaps)
- ✅ Handle companies with limited public data
- ⚡ Quick lookup (lightweight operation)

## Running Tests

### Run All AI Integration Tests
```bash
npx jest tests/integration/ai
```

### Run Specific Test Suite
```bash
# Partner research
npx jest tests/integration/ai/partner.research.test.ts

# Vendor research
npx jest tests/integration/ai/vendor.research.test.ts

# Joint analysis
npx jest tests/integration/ai/joint.analysis.test.ts

# Filter generation
npx jest tests/integration/ai/filter.generation.test.ts

# Outreach messages
npx jest tests/integration/ai/outreach.test.ts

# Partner scoring
npx jest tests/integration/ai/scoring.test.ts

# Profile enrichment
npx jest tests/integration/ai/enrichment.test.ts
```

### Run with Verbose Output
```bash
npx jest tests/integration/ai --verbose
```

### Run in Watch Mode (for development)
```bash
npx jest tests/integration/ai --watch
```

## Requirements

### Environment Variables
Ensure you have the following environment variables set:

```bash
# Google (Gemini) - Primary provider for tests
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key

# Optional: Other providers for testing
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### API Keys
- **Google Gemini**: Required for all tests (default provider)
- **OpenAI**: Optional (for cross-provider testing)
- **Anthropic**: Optional (for cross-provider testing)

## Performance Expectations

### Expected Timings
- **Filter Generation**: 5-15 seconds (no web search)
- **Outreach Messages**: 5-15 seconds (no web search)
- **Profile Enrichment**: 15-30 seconds (lightweight web search)
- **Partner Scoring**: 20-40 seconds (complex analysis, no web search)
- **Vendor Research**: 30-60 seconds (comprehensive web search)
- **Partner Research**: 40-60 seconds (comprehensive web search)
- **Joint Analysis**: 30-60 seconds (strategic analysis with web search)

### Timeout
All tests have a **90-second timeout** to catch performance regressions. If any test takes longer than 60 seconds, a warning is logged.

### Performance Issues
If tests are timing out (>90s):
1. Check your network connection
2. Verify API keys are valid
3. Check AI provider status (Google Gemini, OpenAI, Anthropic)
4. Review the specific test input (complex queries take longer)
5. Consider increasing timeout for specific tests if needed

## Test Data

Tests use real, well-known companies for validation:
- **Slack** - Communication platform
- **Shopify** - E-commerce platform
- **Stripe** - Payment processing
- **HubSpot** - Marketing/CRM platform
- **Zoom** - Video conferencing

This ensures:
- ✅ Realistic test scenarios
- ✅ Reliable data availability
- ✅ Consistent test results
- ✅ Validation of real-world use cases

## Troubleshooting

### Test Failures

#### "Request timed out after 90 seconds"
- AI provider may be slow or unavailable
- Network issues
- Complex query requiring more time
- **Solution**: Check provider status, retry test

#### "Schema validation failed"
- AI response doesn't match expected schema
- Provider returned unexpected format
- **Solution**: Check schema definition, review AI response

#### "Cannot find module '@/lib/ai-sdk'"
- TypeScript path mapping issue
- **Solution**: Ensure Jest is configured with `moduleNameMapper`

#### "API key not found"
- Missing environment variables
- **Solution**: Set required API keys in `.env.local`

### Debug Mode

Run tests with detailed logging:
```bash
DEBUG=* npx jest tests/integration/ai --verbose
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run AI Integration Tests
  env:
    GOOGLE_GENERATIVE_AI_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
  run: npx jest tests/integration/ai --ci --maxWorkers=2
  timeout-minutes: 15
```

### Skip in CI (if needed)
```bash
# Skip AI tests in CI due to API costs
npx jest --testPathIgnorePatterns=tests/integration/ai
```

## Cost Considerations

These integration tests make real API calls to AI providers:
- **Google Gemini**: ~$0.01-0.05 per test
- **OpenAI**: ~$0.05-0.15 per test
- **Anthropic**: ~$0.03-0.10 per test

**Total cost per full test run**: ~$0.50-2.00

### Cost Optimization
- Run tests only when needed (not on every commit)
- Use Google Gemini (cheapest) as default provider
- Mock AI calls in unit tests (use integration tests sparingly)
- Set up test budgets/alerts in provider dashboards

## Contributing

When adding new AI features:
1. Create a corresponding integration test
2. Follow the existing test patterns
3. Set 90-second timeout
4. Add performance logging
5. Update this README with new test info
6. Test with real data when possible

## Support

If tests are consistently failing:
1. Check the migration documentation (`MIGRATION_SUMMARY.md`)
2. Review AI SDK implementation (`lib/ai-sdk/`)
3. Verify schema definitions match prompts
4. Test individual functions in isolation
5. Check provider status pages

---

**Last Updated**: October 2025
**AI SDK Version**: Vercel AI SDK v5.0.76
**Test Framework**: Jest v30.2.0

