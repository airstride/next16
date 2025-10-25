# Quick Test Commands

## Run All AI Integration Tests

### Windows (PowerShell)
```powershell
npx jest tests/integration/ai
```

### Linux/Mac (Bash)
```bash
npx jest tests/integration/ai
```

## Run Individual Tests

### Partner Research (longest, ~40-60s)
```bash
npx jest tests/integration/ai/partner.research.test.ts
```

### Vendor Research (long, ~30-60s)
```bash
npx jest tests/integration/ai/vendor.research.test.ts
```

### Joint Analysis (~30-60s)
```bash
npx jest tests/integration/ai/joint.analysis.test.ts
```

### Filter Generation (fast, ~5-15s)
```bash
npx jest tests/integration/ai/filter.generation.test.ts
```

### Outreach Messages (fast, ~5-15s)
```bash
npx jest tests/integration/ai/outreach.test.ts
```

### Partner Scoring (~20-40s)
```bash
npx jest tests/integration/ai/scoring.test.ts
```

### Profile Enrichment (~15-30s)
```bash
npx jest tests/integration/ai/enrichment.test.ts
```

## Run with Options

### Verbose Output
```bash
npx jest tests/integration/ai --verbose
```

### Run Specific Test
```bash
npx jest tests/integration/ai/partner.research.test.ts -t "should successfully research"
```

### Watch Mode (for development)
```bash
npx jest tests/integration/ai --watch
```

### Sequential Execution (prevents rate limiting)
```bash
npx jest tests/integration/ai --runInBand
```

## Performance Testing

### Run with Timing
```bash
npx jest tests/integration/ai --verbose | grep "completed in"
```

### Check for Slow Tests (>60s)
```bash
npx jest tests/integration/ai --verbose | grep "Warning"
```

## Environment Setup

Before running tests, ensure you have the API key set:

### Windows (PowerShell)
```powershell
$env:GOOGLE_GENERATIVE_AI_API_KEY="your_google_api_key"
npx jest tests/integration/ai
```

### Linux/Mac (Bash)
```bash
export GOOGLE_GENERATIVE_AI_API_KEY="your_google_api_key"
npx jest tests/integration/ai
```

### Using .env.local (recommended)
Create `.env.local` in project root:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key (optional)
ANTHROPIC_API_KEY=your_anthropic_api_key (optional)
```

## Quick Validation After Migration

Test each feature quickly:

```bash
# 1. Fast tests first (filters + outreach)
npx jest tests/integration/ai/filter.generation.test.ts tests/integration/ai/outreach.test.ts

# 2. Medium tests (enrichment + scoring)
npx jest tests/integration/ai/enrichment.test.ts tests/integration/ai/scoring.test.ts

# 3. Slow tests (research + analysis)
npx jest tests/integration/ai/partner.research.test.ts tests/integration/ai/vendor.research.test.ts tests/integration/ai/joint.analysis.test.ts
```

## Troubleshooting

### Tests Timing Out
```bash
# Increase timeout (already set to 90s in tests)
# If still timing out, check:
# 1. Network connection
# 2. API provider status
# 3. API key validity
```

### API Rate Limits
```bash
# Run tests sequentially with delays
npx jest tests/integration/ai --runInBand --maxWorkers=1
```

### Debugging Failed Tests
```bash
# Run single test with full output
npx jest tests/integration/ai/partner.research.test.ts --verbose --no-coverage
```

## Expected Output

Each test will show:
- ✅ Success indicators
- ⏱️ Execution time
- 📊 Result details
- ⚠️ Warnings if >60s

Example output:
```
🔍 Starting partner research test...
  Company: Slack
  Website: https://slack.com
✅ Research completed in 45.23s
  Result type: success
  Sources found: 15
  Company name: Slack Technologies
  Categories: 8
  Products: 5
```

