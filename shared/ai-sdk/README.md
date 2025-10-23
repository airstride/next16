# AI SDK Service - Developer Guide

A simplified, unified interface for working with OpenAI, Anthropic (Claude), and Google (Gemini) AI models.

## Features

✅ **Simple API** - Easy-to-use methods for common AI tasks  
✅ **Web Search** - Native provider web search support (all providers)  
✅ **Structured Output** - Type-safe JSON generation with Zod schemas  
✅ **History Management** - Simple conversation history handling  
✅ **Multi-Provider** - Seamless switching between OpenAI, Anthropic, and Gemini  
✅ **Streaming** - Real-time text generation for UIs  

---

## Quick Start

```typescript
import { 
  generateText, 
  generateTextWithWebSearch,
  generateStructuredOutput,
  AIProvider,
  AIModel 
} from '@/lib/ai-sdk/ai.sdk.service';
import { z } from 'zod';
```

---

## 1. Simple Text Generation

```typescript
// Basic text generation
const result = await generateText({
  prompt: 'Explain quantum computing in one sentence',
  config: { 
    provider: AIProvider.OPENAI,
    model: AIModel.GPT_5_NANO 
  }
});

console.log(result.text);
```

---

## 2. Conversation History

Just pass the full message array - history is managed automatically:

```typescript
// First message
const result1 = await generateTextWithHistory({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is TypeScript?' }
  ],
  config: { provider: AIProvider.GOOGLE }
});

// Continue conversation
const result2 = await generateTextWithHistory({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is TypeScript?' },
    { role: 'assistant', content: result1.text },
    { role: 'user', content: 'Why should I use it?' }
  ],
  config: { provider: AIProvider.GOOGLE }
});
```

---

## 3. Web Search (Native Support)

All providers support native web search:

```typescript
// Simple web search
const result = await generateTextWithWebSearch({
  prompt: 'What are the latest developments in AI?',
  config: { 
    provider: AIProvider.GOOGLE // or OPENAI or ANTHROPIC
  }
});

console.log(result.text);
console.log('Sources:', result.sources);
console.log('Tool calls:', result.toolCalls);

// Web search with history
const result2 = await generateTextWithWebSearch({
  messages: [
    { role: 'system', content: 'You are a research assistant.' },
    { role: 'user', content: 'Research Acme Corporation and provide key facts' }
  ],
  config: { 
    provider: AIProvider.OPENAI,
    searchContextSize: 'high' // OpenAI specific
  }
});
```

### Provider-Specific Options

**OpenAI:**
```typescript
config: {
  provider: AIProvider.OPENAI,
  searchContextSize: 'low' | 'medium' | 'high'
}
```

**Anthropic:**
```typescript
config: {
  provider: AIProvider.ANTHROPIC,
  maxSearchUses: 5 // Max number of searches
}
```

**Google Gemini:**
```typescript
config: {
  provider: AIProvider.GOOGLE
  // No additional options needed
}
```

---

## 4. Structured Output

Generate type-safe JSON using Zod schemas:

```typescript
// Define your schema
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.email(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    country: z.string()
  })
});

type User = z.infer<typeof UserSchema>;

// Generate structured data
const result = await generateStructuredOutput<User>({
  prompt: 'Create a user profile for John Smith, age 30, email: john@example.com',
  schema: UserSchema,
  config: { 
    provider: AIProvider.GOOGLE,
    schemaName: 'UserProfile',
    schemaDescription: 'A user profile with contact information'
  }
});

// Type-safe result!
console.log(result.object.name); // TypeScript knows this is a string
console.log(result.object.age);  // TypeScript knows this is a number
```

### With Conversation History

```typescript
const CompanySchema = z.object({
  name: z.string(),
  industry: z.string(),
  employees: z.number(),
  founded: z.number()
});

const result = await generateStructuredOutput({
  messages: [
    { role: 'system', content: 'You are a data extraction assistant.' },
    { role: 'user', content: 'Extract company info: Tesla, founded 2003, automotive industry, 100k+ employees' }
  ],
  schema: CompanySchema,
  config: { provider: AIProvider.OPENAI }
});
```

---

## 5. Streaming

For real-time UIs:

```typescript
// Stream with prompt
const stream = await streamText({
  prompt: 'Write a short story about a robot',
  config: { provider: AIProvider.ANTHROPIC }
});

// Consume the stream using reader
const reader = stream.textStream.getReader();
try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    process.stdout.write(value);
  }
} finally {
  reader.releaseLock();
}

// Or get the full text when done
const fullText = await stream.fullTextPromise;

// Stream with history
const stream2 = await streamText({
  messages: [
    { role: 'system', content: 'You are a creative writer.' },
    { role: 'user', content: 'Write a poem about the ocean' }
  ],
  config: { provider: AIProvider.GOOGLE }
});
```

---

## Configuration Options

### Providers

```typescript
enum AIProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google"
}
```

### Models

```typescript
enum AIModel {
  // OpenAI
  GPT_5 = "gpt-5",
  GPT_5_MINI = "gpt-5-mini",
  GPT_5_NANO = "gpt-5-nano",

  // Anthropic
  CLAUDE_SONNET_4_5 = "claude-sonnet-4-5-20250929",
  CLAUDE_OPUS_4_1 = "claude-opus-4-1-20250805",
  CLAUDE_HAIKU_4_5 = "claude-haiku-4-5-20251001",

  // Google
  GEMINI_2_5_PRO = "gemini-2.5-pro",
  GEMINI_2_5_FLASH = "gemini-2.5-flash",
  GEMINI_2_5_FLASH_LITE = "gemini-2.5-flash-lite"
}
```

### Temperature Presets

```typescript
enum TemperaturePreset {
  DETERMINISTIC = 0.1,  // Maximum consistency
  PRECISE = 0.3,        // Structured outputs
  BALANCED = 0.5,       // General purpose
  CREATIVE = 0.8        // Creative content
}

// Usage
config: {
  temperature: TemperaturePreset.PRECISE
}
```

### Max Tokens Presets

```typescript
enum MaxTokensPreset {
  SHORT = 1000,
  MEDIUM = 4096,
  LONG = 8192,
  EXTENDED = 16384
}

// Usage
config: {
  maxTokens: MaxTokensPreset.MEDIUM
}
```

---

## Advanced: Using the Service Class

For more control, use the service class directly:

```typescript
import { AISdkService, AIProvider, AIModel } from '@/lib/ai-sdk/ai.sdk.service';

// Create instance with custom defaults
const aiService = new AISdkService(
  AIProvider.OPENAI,
  AIModel.GPT_5_NANO
);

// Use the instance
const result = await aiService.generateText({
  prompt: 'Hello!',
  config: { temperature: 0.7 }
});

// Change defaults
aiService.setDefaultProvider(AIProvider.GOOGLE);
aiService.setDefaultModel(AIModel.GEMINI_2_5_FLASH);
```

---

## Common Patterns

### Pattern 1: Multi-Step Research with Web Search

```typescript
// Step 1: Research
const research = await generateTextWithWebSearch({
  prompt: 'Research the latest trends in renewable energy',
  config: { provider: AIProvider.GOOGLE }
});

// Step 2: Extract structured data
const TrendsSchema = z.object({
  trends: z.array(z.object({
    name: z.string(),
    description: z.string(),
    impact: z.enum(['high', 'medium', 'low'])
  }))
});

const structured = await generateStructuredOutput({
  messages: [
    { role: 'user', content: 'Research the latest trends in renewable energy' },
    { role: 'assistant', content: research.text },
    { role: 'user', content: 'Extract the key trends as structured data' }
  ],
  schema: TrendsSchema,
  config: { provider: AIProvider.GOOGLE }
});

console.log(structured.object.trends);
```

### Pattern 2: Interactive Conversation

```typescript
const conversationHistory: ConversationMessage[] = [
  { role: 'system', content: 'You are a helpful coding assistant.' }
];

async function chat(userMessage: string) {
  conversationHistory.push({ role: 'user', content: userMessage });
  
  const result = await generateTextWithHistory({
    messages: conversationHistory,
    config: { provider: AIProvider.ANTHROPIC }
  });
  
  conversationHistory.push({ role: 'assistant', content: result.text });
  
  return result.text;
}

// Use it
await chat('How do I use async/await in TypeScript?');
await chat('Can you give me an example?');
```

### Pattern 3: Validation with Structured Output

```typescript
const ValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  suggestions: z.array(z.string())
});

async function validateCode(code: string) {
  const result = await generateStructuredOutput({
    prompt: `Validate this TypeScript code and provide feedback: ${code}`,
    schema: ValidationSchema,
    config: { 
      provider: AIProvider.OPENAI,
      temperature: TemperaturePreset.PRECISE
    }
  });
  
  return result.object;
}
```

---

## Error Handling

```typescript
try {
  const result = await generateText({
    prompt: 'Hello',
    config: { provider: AIProvider.OPENAI }
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('AI generation failed:', error.message);
  }
}
```

---

## Best Practices

1. **Choose the right provider:**
   - OpenAI: Best for general purpose and reasoning tasks
   - Anthropic: Excellent for long context and nuanced understanding
   - Google Gemini: Fast, cost-effective, great for high-volume

2. **Use appropriate temperature:**
   - 0.1-0.3: Structured data extraction, analysis
   - 0.5-0.7: General conversation, Q&A
   - 0.8-1.0: Creative writing, brainstorming

3. **Manage token usage:**
   - Use SHORT or MEDIUM for most tasks
   - LONG only when necessary
   - Monitor usage in response objects

4. **Structured output vs text:**
   - Use `generateStructuredOutput` when you need validated JSON
   - Use `generateText` for natural language responses

5. **Web search usage:**
   - Only use when real-time information is needed
   - More expensive than regular generation
   - Check sources for reliability

---

## Environment Variables

Make sure these are set:

```bash
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GEMINI_API_KEY=your-google-key
```

---

## Migration from Old API

### Before (Old API):
```typescript
const result = await aiService.generateTextWithWebSearchAndHistory({
  messages: [...],
  config: { ... }
});
```

### After (Simplified API):
```typescript
const result = await generateTextWithWebSearch({
  messages: [...],
  config: { ... }
});
```

Key changes:
- ✅ Combined web search methods (prompt or messages)
- ✅ Simplified history management (just pass arrays)
- ✅ Added `generateStructuredOutput` for type-safe JSON
- ✅ All providers support native web search
- ✅ Removed complex conversation management

---

## Testing

Comprehensive tests are available for all AI SDK features, including structured outputs with Zod schemas.

### Test Files

- **`structured-outputs.test.ts`** - Jest integration tests for Zod schema validation
- **`test-structured-outputs.ts`** - Standalone comprehensive test suite with detailed output
- **`test-web-search.ts`** - Web search capabilities across all providers
- **`ai.sdk.service.test.ts`** - Basic multi-provider integration tests

### Running Tests

```bash
# Run Jest tests
yarn test lib/ai-sdk/structured-outputs.test.ts

# Run standalone comprehensive tests
npx tsx lib/ai-sdk/test-structured-outputs.ts

# Run web search tests
npx tsx lib/ai-sdk/test-web-search.ts
```

### What's Tested

✅ **Zod Schemas**: Simple, nested, arrays, enums, unions, optional/nullable fields  
✅ **All Providers**: OpenAI, Anthropic, Google Gemini  
✅ **Temperature Presets**: All 15 presets from 0.1 to 2.0  
✅ **Max Tokens Presets**: SHORT, MEDIUM, LONG, EXTENDED  
✅ **Conversation History**: Multi-turn conversations with schema extraction  
✅ **Schema Metadata**: Schema names and descriptions  
✅ **Error Handling**: Validation and edge cases  
✅ **Cross-Provider Consistency**: Same schema across different providers  

See [TESTING.md](./TESTING.md) for comprehensive testing documentation.

---

## Support

For issues or questions, check:
- [Vercel AI SDK Docs](https://ai-sdk.dev)
- [Web Search Agent Pattern](https://ai-sdk.dev/cookbook/node/web-search-agent)
- [Structured Data Guide](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- [Testing Guide](./TESTING.md)
