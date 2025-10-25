# AI SDK Streaming Guide

## Overview

The AI SDK now supports streaming structured outputs with real-time progress updates. This provides a better user experience for long-running AI operations by showing users what's happening in real-time, similar to ChatGPT and other modern AI chat interfaces.

## Features

✅ **Streaming Structured Output** - Get partial JSON objects as they're generated  
✅ **Progress Events** - Real-time status updates with custom messages  
✅ **Web Search Integration** - Stream results from AI with web search  
✅ **Server-Sent Events (SSE)** - Browser-compatible streaming via SSE  
✅ **Type-Safe** - Full TypeScript support with generics  
✅ **Error Handling** - Automatic error events and graceful degradation  

## Quick Start

### 1. Basic Streaming Structured Output

```typescript
import { streamStructuredOutput } from '@/shared/ai-sdk';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string(),
});

const stream = await streamStructuredOutput({
  prompt: 'Extract user data: John Smith, 30, john@example.com',
  schema: UserSchema,
  config: { provider: AIProvider.GOOGLE }
});

// Process partial updates as they arrive
for await (const partial of stream.partialObjectStream) {
  console.log('Partial update:', partial);
  // Output: { name: 'John Smith' }
  // Output: { name: 'John Smith', age: 30 }
  // Output: { name: 'John Smith', age: 30, email: 'john@example.com' }
}

// Or wait for the complete object
const complete = await stream.objectPromise;
console.log('Complete:', complete);
```

### 2. Streaming with Web Search and Progress Events

```typescript
import { streamStructuredOutputWithWebSearch, StreamEventType } from '@/shared/ai-sdk';
import { z } from 'zod';

const CompanySchema = z.object({
  name: z.string(),
  industry: z.string(),
  description: z.string(),
  competitors: z.array(z.string()).optional(),
});

const stream = await streamStructuredOutputWithWebSearch({
  prompt: 'Research Shopify and extract company details',
  schema: CompanySchema,
  config: {
    provider: AIProvider.GOOGLE,
    enableProgressEvents: true,
    progressMessages: {
      search: '🔍 Researching Shopify...',
      extract: '📊 Extracting company data...',
      complete: '✅ Research complete!'
    }
  }
});

// Consume progress events for UX updates
if (stream.eventStream) {
  for await (const event of stream.eventStream) {
    console.log(`[${event.type}] ${event.message} (${event.progress}%)`);
    
    switch (event.type) {
      case StreamEventType.START:
        // Show loading spinner
        break;
      case StreamEventType.SEARCH:
        // Update UI: "Searching the web..."
        break;
      case StreamEventType.PROGRESS:
        // Update progress bar
        console.log(`Sources found: ${event.metadata?.sourcesFound}`);
        break;
      case StreamEventType.PARTIAL:
        // Display partial data
        console.log('Partial data:', event.data);
        break;
      case StreamEventType.COMPLETE:
        // Hide loading, show success
        console.log('Final data:', event.data);
        break;
      case StreamEventType.ERROR:
        // Show error message
        console.error('Error:', event.error?.message);
        break;
    }
  }
}
```

## API Reference

### `streamStructuredOutput<T>(params)`

Stream structured output generation with partial updates.

**Parameters:**
- `prompt?: string` - The prompt to generate from
- `messages?: ConversationMessage[]` - Conversation history
- `schema: z.ZodType<T>` - Zod schema for validation
- `config?: GenerateStructuredConfig` - Configuration options

**Returns:** `Promise<GenerateStructuredStreamResult<T>>`
- `partialObjectStream: ReadableStream<Partial<T>>` - Stream of partial objects
- `objectPromise: Promise<T>` - Promise for the complete object
- `usage: Promise<UsageInfo>` - Token usage information

### `streamStructuredOutputWithWebSearch<T>(params)`

Stream structured output with web search and progress events.

**Parameters:**
- `prompt?: string` - The research prompt
- `messages?: ConversationMessage[]` - Conversation history
- `schema: z.ZodType<T>` - Zod schema for validation
- `config?: WebSearchConfig & StreamStructuredConfig` - Configuration options
  - `enableProgressEvents?: boolean` - Enable progress events (default: true)
  - `progressMessages?: { search?, extract?, complete? }` - Custom messages

**Returns:** `Promise<GenerateStructuredStreamResult<T> & { sources?, searchTextPromise }>`
- All properties from `streamStructuredOutput()`, plus:
- `eventStream?: ReadableStream<StreamEvent<T>>` - Stream of progress events
- `sources?: any[]` - Web search sources
- `searchTextPromise: Promise<string>` - Search results text

### Stream Event Types

```typescript
enum StreamEventType {
  START = "start",       // Streaming started
  PROGRESS = "progress", // General progress update
  PARTIAL = "partial",   // Partial data received
  COMPLETE = "complete", // Streaming complete
  ERROR = "error",       // Error occurred
  SEARCH = "search",     // Web search in progress
  EXTRACT = "extract",   // Data extraction in progress
}
```

### Stream Event Structure

```typescript
interface StreamEvent<T = any> {
  type: StreamEventType;
  message?: string;           // Human-readable status
  data?: Partial<T>;          // Partial or complete data
  step?: string;              // Current phase
  progress?: number;          // Progress percentage (0-100)
  error?: {
    message: string;
    code?: string;
  };
  metadata?: Record<string, any>;
}
```

## Usage in API Routes (Server-Sent Events)

### Streaming API Endpoint Example

```typescript
import { NextRequest } from "next/server";
import { streamStructuredOutputWithWebSearch, StreamEventType } from "@/shared/ai-sdk";

export const POST = async (req: NextRequest) => {
  const { websiteUrl } = await req.json();
  
  const stream = await streamStructuredOutputWithWebSearch({
    prompt: `Research ${websiteUrl}`,
    schema: CompanySchema,
    config: {
      enableProgressEvents: true
    }
  });

  // Create SSE stream
  const encoder = new TextEncoder();
  const sseStream = new ReadableStream({
    async start(controller) {
      if (stream.eventStream) {
        const reader = stream.eventStream.getReader();
        
        try {
          while (true) {
            const { done, value: event } = await reader.read();
            if (done) break;
            
            // Send as SSE format
            const sseMessage = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(sseMessage));
            
            if (event.type === StreamEventType.COMPLETE || 
                event.type === StreamEventType.ERROR) {
              controller.close();
              break;
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    }
  });

  return new Response(sseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
};
```

### Client-Side Consumption (Browser)

```typescript
// Using EventSource API
const eventSource = new EventSource('/api/clients/research/stream', {
  method: 'POST',
  body: JSON.stringify({ website_url: 'https://shopify.com' })
});

eventSource.addEventListener('start', (e) => {
  const event = JSON.parse(e.data);
  console.log('Starting:', event.message);
});

eventSource.addEventListener('progress', (e) => {
  const event = JSON.parse(e.data);
  updateProgressBar(event.progress);
  setStatusMessage(event.message);
});

eventSource.addEventListener('partial', (e) => {
  const event = JSON.parse(e.data);
  updateUIWithPartialData(event.data);
});

eventSource.addEventListener('complete', (e) => {
  const event = JSON.parse(e.data);
  showCompleteData(event.data);
  eventSource.close();
});

eventSource.addEventListener('error', (e) => {
  const event = JSON.parse(e.data);
  showError(event.error.message);
  eventSource.close();
});
```

## Real-World Example: Client Research

See `app/api/clients/research/stream/route.ts` for a complete implementation of streaming website research with progress updates.

**Features:**
- Real-time progress: "🔍 Researching website..." → "📊 Extracting data..." → "✅ Complete!"
- Partial data updates as company info is extracted
- Automatic error handling and recovery
- Source attribution from web search
- Token usage tracking

## Best Practices

### 1. **Always Handle All Event Types**

```typescript
if (stream.eventStream) {
  for await (const event of stream.eventStream) {
    switch (event.type) {
      case StreamEventType.START:
      case StreamEventType.SEARCH:
      case StreamEventType.PROGRESS:
      case StreamEventType.EXTRACT:
      case StreamEventType.PARTIAL:
      case StreamEventType.COMPLETE:
      case StreamEventType.ERROR:
        // Handle each type appropriately
    }
  }
}
```

### 2. **Provide Custom Progress Messages**

Make your UX better with contextual messages:

```typescript
config: {
  progressMessages: {
    search: '🔍 Analyzing your website...',
    extract: '📊 Building your company profile...',
    complete: '✅ Profile ready!'
  }
}
```

### 3. **Stream Long-Running Operations Only**

Use streaming for operations > 5 seconds. For quick operations, use the regular non-streaming API.

### 4. **Close Streams Properly**

Always close event streams when done or on error:

```typescript
try {
  // Process stream
} catch (error) {
  // Handle error
} finally {
  if (eventStreamController) {
    eventStreamController.close();
  }
}
```

### 5. **Show Progress Visually**

Update your UI based on progress events:

```typescript
if (event.progress) {
  progressBar.style.width = `${event.progress}%`;
  statusText.innerText = event.message;
}
```

## Performance Considerations

- **Token Usage:** Streaming uses the same tokens as non-streaming
- **Latency:** First token arrives faster with streaming (~2-3s vs 30-60s for full response)
- **Network:** SSE keeps connection open; consider connection limits
- **Memory:** Stream readers should be released when done

## Troubleshooting

### Stream Not Closing

Ensure you're checking for `COMPLETE` or `ERROR` events and closing the stream:

```typescript
if (event.type === StreamEventType.COMPLETE || 
    event.type === StreamEventType.ERROR) {
  controller.close();
}
```

### No Progress Events

Check that `enableProgressEvents: true` is set in config:

```typescript
config: {
  enableProgressEvents: true
}
```

### Partial Data Not Updating UI

Make sure you're consuming the `partialObjectStream` or `eventStream`:

```typescript
// Either consume events
for await (const event of stream.eventStream) {
  if (event.data) {
    updateUI(event.data);
  }
}

// Or consume partial objects
for await (const partial of stream.partialObjectStream) {
  updateUI(partial);
}
```

## Migration from Non-Streaming

**Before:**
```typescript
const result = await generateStructuredOutputWithWebSearch({
  prompt: 'Research company',
  schema: CompanySchema
});
console.log(result.object); // Wait for complete response
```

**After:**
```typescript
const stream = await streamStructuredOutputWithWebSearch({
  prompt: 'Research company',
  schema: CompanySchema,
  config: { enableProgressEvents: true }
});

// Show progress in real-time
for await (const event of stream.eventStream) {
  console.log(event.message); // "Searching...", "Extracting...", etc.
}

const result = await stream.objectPromise; // Still get final result
```

## Related Documentation

- [AI SDK Service](./ai.sdk.service.ts)
- [AI SDK Types](./types.ts)
- [Client Research Stream Endpoint](../../app/api/clients/research/stream/route.ts)
- [Client Service](../../modules/clients/application/service.ts)

---

**Last Updated:** October 2025  
**Version:** 1.0.0

