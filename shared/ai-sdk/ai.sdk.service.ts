import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import {
  generateObject as aiGenerateObject,
  generateText as aiGenerateText,
  streamText as aiStreamText,
} from "ai";
import type { LanguageModel, ModelMessage } from "ai";
import { z } from "zod";
import {
  AIModel,
  AIProvider,
  type ConversationMessage,
  type GenerateConfig,
  type GenerateStructuredConfig,
  type GenerateStructuredResult,
  type GenerateTextResult,
  type GenerateTextStreamResult,
  type GenerateWithToolsResult,
  type ToolCallResult,
  type WebSearchConfig,
} from "./types";

/**
 * Simplified AI SDK Service
 *
 * Easy-to-use interface for:
 * - Text generation with web search (native provider support)
 * - Structured output generation (all providers)
 * - Conversation history management (simplified)
 *
 * Supports: OpenAI, Anthropic (Claude), and Google (Gemini)
 */
export class AISdkService {
  private defaultProvider: AIProvider;
  private defaultModel: AIModel | string;

  constructor(
    defaultProvider: AIProvider = AIProvider.GOOGLE,
    defaultModel: AIModel | string = AIModel.GEMINI_2_5_FLASH_LITE
  ) {
    this.defaultProvider = defaultProvider;
    this.defaultModel = defaultModel;
  }

  /**
   * Get the appropriate provider's model instance
   */
  private getModel(provider: AIProvider, model: string): LanguageModel {
    switch (provider) {
      case AIProvider.OPENAI:
        return openai(model);
      case AIProvider.ANTHROPIC:
        return anthropic(model);
      case AIProvider.GOOGLE:
        return google(model);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Convert conversation messages to ModelMessage format
   */
  private convertMessages(messages: ConversationMessage[]): ModelMessage[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })) as ModelMessage[];
  }

  /**
   * Generate text from a prompt (simple, no history)
   *
   * @example
   * const result = await aiService.generateText({
   *   prompt: 'Explain TypeScript in one sentence',
   *   config: { provider: AIProvider.OPENAI, model: AIModel.GPT_5_NANO }
   * });
   */
  async generateText(params: {
    prompt: string;
    config?: GenerateConfig;
  }): Promise<GenerateTextResult> {
    const { prompt, config = {} } = params;
    const provider = config.provider ?? this.defaultProvider;
    const modelName = config.model ?? this.defaultModel;

    const model = this.getModel(provider, modelName as string);

    const result = await aiGenerateText({
      model,
      prompt,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      topP: config.topP,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
      maxRetries: 3,
    });

    return {
      text: result.text,
      finishReason: result.finishReason,
      usage: {
        promptTokens: (result.usage as any).promptTokens || 0,
        completionTokens: (result.usage as any).completionTokens || 0,
        totalTokens: (result.usage as any).totalTokens || 0,
      },
      rawResponse: result.response,
    };
  }

  /**
   * Generate text with conversation history
   *
   * History is automatically managed:
   * - Pass messages array for the full conversation
   * - Or use conversationId to continue a previous conversation
   *
   * @example
   * // Simple conversation with history
   * const result = await aiService.generateTextWithHistory({
   *   messages: [
   *     { role: 'system', content: 'You are a helpful assistant.' },
   *     { role: 'user', content: 'What is TypeScript?' }
   *   ]
   * });
   *
   * // Continue conversation (history managed automatically)
   * const result2 = await aiService.generateTextWithHistory({
   *   messages: [
   *     { role: 'system', content: 'You are a helpful assistant.' },
   *     { role: 'user', content: 'What is TypeScript?' },
   *     { role: 'assistant', content: result.text },
   *     { role: 'user', content: 'Why should I use it?' }
   *   ]
   * });
   */
  async generateTextWithHistory(params: {
    messages: ConversationMessage[];
    config?: GenerateConfig;
  }): Promise<GenerateTextResult> {
    const { messages, config = {} } = params;
    const provider = config.provider ?? this.defaultProvider;
    const modelName = config.model ?? this.defaultModel;

    const model = this.getModel(provider, modelName as string);
    const coreMessages = this.convertMessages(messages);

    const result = await aiGenerateText({
      model,
      messages: coreMessages,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      topP: config.topP,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
      maxRetries: 3,
    });

    return {
      text: result.text,
      finishReason: result.finishReason,
      usage: {
        promptTokens: (result.usage as any).promptTokens || 0,
        completionTokens: (result.usage as any).completionTokens || 0,
        totalTokens: (result.usage as any).totalTokens || 0,
      },
      rawResponse: result.response,
    };
  }

  /**
   * Generate text with web search (native provider support)
   *
   * Supports:
   * - OpenAI: Uses web_search tool
   * - Google Gemini: Uses googleSearch tool
   * - Anthropic: Uses web_search tool
   *
   * @example
   * const result = await aiService.generateTextWithWebSearch({
   *   prompt: 'What are the latest developments in quantum computing?',
   *   config: { provider: AIProvider.GOOGLE }
   * });
   *
   * // With history
   * const result2 = await aiService.generateTextWithWebSearch({
   *   prompt: 'Research Acme Corporation and provide key facts',
   *   messages: [
   *     { role: 'system', content: 'You are a research assistant.' }
   *   ],
   *   config: { provider: AIProvider.OPENAI }
   * });
   */
  async generateTextWithWebSearch(params: {
    prompt?: string;
    messages?: ConversationMessage[];
    config?: WebSearchConfig;
  }): Promise<GenerateWithToolsResult> {
    const { prompt, messages, config = {} } = params;
    const provider = config.provider ?? this.defaultProvider;
    const modelName = config.model ?? this.defaultModel;

    if (!prompt && !messages) {
      throw new Error("Either 'prompt' or 'messages' must be provided");
    }

    let model: LanguageModel;
    let tools: Record<string, any>;

    // Configure provider-specific native web search tools
    switch (provider) {
      case AIProvider.OPENAI: {
        // OpenAI with web search tool
        model = openai(modelName as string);
        tools = {
          web_search: openai.tools.webSearch({
            searchContextSize: config.searchContextSize,
          }),
        };
        break;
      }

      case AIProvider.GOOGLE: {
        // Gemini with googleSearch tool
        model = google(modelName as string);
        tools = {
          google_search: google.tools.googleSearch({}),
        };
        break;
      }

      case AIProvider.ANTHROPIC: {
        // Anthropic with web_search tool
        model = anthropic(modelName as string);
        tools = {
          web_search: anthropic.tools.webSearch_20250305({
            maxUses: config.maxSearchUses,
          }),
        };
        break;
      }

      default:
        throw new Error(`Unsupported provider for web search: ${provider}`);
    }

    // Build request params
    const requestParams: any = {
      model,
      tools,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      topP: config.topP,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
      maxRetries: 3,
    };

    // Add prompt or messages
    if (prompt) {
      requestParams.prompt = prompt;
    } else if (messages) {
      requestParams.messages = this.convertMessages(messages);
    }

    const result = await aiGenerateText(requestParams);

    // Extract sources if available
    const sources = (result as any).sources;

    // Extract tool calls and steps from result
    const toolCalls: ToolCallResult[] = [];
    const steps: Array<{ type: "text" | "tool-call"; content: string | ToolCallResult }> = [];

    // Process tool calls if available
    if (result.steps) {
      for (const step of result.steps) {
        const stepAny = step as any;
        if (stepAny.type === "tool-call") {
          const toolCall: ToolCallResult = {
            toolName: stepAny.toolName || "unknown",
            args: stepAny.args || {},
            result: stepAny.result,
          };
          toolCalls.push(toolCall);
          steps.push({ type: "tool-call", content: toolCall });
        }
      }
    }

    // Add final text step
    if (result.text) {
      steps.push({ type: "text", content: result.text });
    }

    return {
      text: result.text,
      finishReason: result.finishReason,
      usage: {
        promptTokens: (result.usage as any).promptTokens || 0,
        completionTokens: (result.usage as any).completionTokens || 0,
        totalTokens: (result.usage as any).totalTokens || 0,
      },
      toolCalls,
      steps,
      sources,
      rawResponse: result.response,
    };
  }

  /**
   * Generate structured output using Zod schema
   *
   * Works with all providers (OpenAI, Anthropic, Google Gemini)
   * Returns type-safe, validated JSON objects
   *
   * @example
   * const schema = z.object({
   *   name: z.string(),
   *   age: z.number(),
   *   email: z.email()
   * });
   *
   * const result = await aiService.generateStructuredOutput({
   *   prompt: 'Generate a user profile for John Smith, age 30',
   *   schema,
   *   config: { provider: AIProvider.OPENAI }
   * });
   *
   * // With history
   * const result2 = await aiService.generateStructuredOutput({
   *   messages: [
   *     { role: 'system', content: 'You are a data extraction assistant.' },
   *     { role: 'user', content: 'Extract user info: John Smith, 30 years old' }
   *   ],
   *   schema,
   *   config: { provider: AIProvider.GOOGLE }
   * });
   */
  async generateStructuredOutput<T = any>(params: {
    prompt?: string;
    messages?: ConversationMessage[];
    schema: z.ZodType<T>;
    config?: GenerateStructuredConfig;
  }): Promise<GenerateStructuredResult<T>> {
    const { prompt, messages, schema, config = {} } = params;
    const provider = config.provider ?? this.defaultProvider;
    const modelName = config.model ?? this.defaultModel;

    if (!prompt && !messages) {
      throw new Error("Either 'prompt' or 'messages' must be provided");
    }

    const model = this.getModel(provider, modelName as string);

    // Build request params
    const requestParams: any = {
      model,
      schema,
      schemaName: config.schemaName,
      schemaDescription: config.schemaDescription,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      topP: config.topP,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
      maxRetries: 3,
      mode: "json", // Use JSON mode for all providers
    };

    // Add prompt or messages
    if (prompt) {
      requestParams.prompt = prompt;
    } else if (messages) {
      requestParams.messages = this.convertMessages(messages);
    }

    const result = await aiGenerateObject(requestParams);

    return {
      object: result.object as T,
      finishReason: result.finishReason,
      usage: {
        promptTokens: (result.usage as any).promptTokens || 0,
        completionTokens: (result.usage as any).completionTokens || 0,
        totalTokens: (result.usage as any).totalTokens || 0,
      },
      rawResponse: result.response,
    };
  }

  /**
   * Stream text generation (for real-time UIs)
   *
   * @example
   * const result = await aiService.streamText({
   *   prompt: 'Write a story about a robot',
   *   config: { provider: AIProvider.ANTHROPIC }
   * });
   *
   * // Consume the stream
   * for await (const chunk of result.textStream) {
   *   process.stdout.write(chunk);
   * }
   */
  async streamText(params: {
    prompt?: string;
    messages?: ConversationMessage[];
    config?: GenerateConfig;
  }): Promise<GenerateTextStreamResult> {
    const { prompt, messages, config = {} } = params;
    const provider = config.provider ?? this.defaultProvider;
    const modelName = config.model ?? this.defaultModel;

    if (!prompt && !messages) {
      throw new Error("Either 'prompt' or 'messages' must be provided");
    }

    const model = this.getModel(provider, modelName as string);

    // Build request params
    const requestParams: any = {
      model,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      topP: config.topP,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
      maxRetries: 3,
    };

    // Add prompt or messages
    if (prompt) {
      requestParams.prompt = prompt;
    } else if (messages) {
      requestParams.messages = this.convertMessages(messages);
    }

    const result = aiStreamText(requestParams);

    return {
      textStream: result.textStream,
      fullTextPromise: result.text,
      usage: result.usage.then((usage: any) => ({
        promptTokens: usage.promptTokens || 0,
        completionTokens: usage.completionTokens || 0,
        totalTokens: usage.totalTokens || 0,
      })),
    };
  }

  /**
   * Generate structured output with web search (two-step process)
   *
   * Step 1: Performs web search to gather information
   * Step 2: Extracts structured data from the search results
   *
   * @example
   * const UserSchema = z.object({
   *   name: z.string(),
   *   age: z.number(),
   *   website: z.string()
   * });
   *
   * const result = await aiService.generateStructuredOutputWithWebSearch({
   *   prompt: 'Research information about Acme Corporation',
   *   schema: UserSchema,
   *   config: { provider: AIProvider.GOOGLE }
   * });
   */
  async generateStructuredOutputWithWebSearch<T = any>(params: {
    prompt?: string;
    messages?: ConversationMessage[];
    schema: z.ZodType<T>;
    config?: WebSearchConfig & GenerateStructuredConfig;
  }): Promise<GenerateStructuredResult<T> & { sources?: any; searchText: string }> {
    const { prompt, messages, schema, config = {} } = params;

    // Step 1: Web search to get context
    const searchResult = await this.generateTextWithWebSearch({
      prompt,
      messages,
      config,
    });

    // Step 2: Extract structured data from the search result
    const structuredResult = await this.generateStructuredOutput({
      prompt: `Based on this research, extract the structured data:\n\n${searchResult.text}`,
      schema,
      config,
    });

    return {
      ...structuredResult,
      sources: searchResult.sources,
      searchText: searchResult.text,
    };
  }

  /**
   * Set default provider for all subsequent calls
   */
  setDefaultProvider(provider: AIProvider): void {
    this.defaultProvider = provider;
  }

  /**
   * Set default model for all subsequent calls
   */
  setDefaultModel(model: AIModel | string): void {
    this.defaultModel = model;
  }

  /**
   * Get current default provider
   */
  getDefaultProvider(): AIProvider {
    return this.defaultProvider;
  }

  /**
   * Get current default model
   */
  getDefaultModel(): AIModel | string {
    return this.defaultModel;
  }
}

/**
 * Singleton instance with sensible defaults (Google Gemini)
 */
export const aiSdkService = new AISdkService();

/**
 * ============================================================================
 * Convenience Functions - Easy-to-use exports for common operations
 * ============================================================================
 */

/**
 * Generate text from a prompt
 *
 * @example
 * const result = await generateText({
 *   prompt: 'Explain quantum computing',
 *   config: { provider: AIProvider.OPENAI }
 * });
 */
export async function generateText(params: {
  prompt: string;
  config?: GenerateConfig;
}): Promise<GenerateTextResult> {
  return aiSdkService.generateText(params);
}

/**
 * Generate text with conversation history
 *
 * @example
 * const result = await generateTextWithHistory({
 *   messages: [
 *     { role: 'system', content: 'You are helpful.' },
 *     { role: 'user', content: 'Hello!' }
 *   ]
 * });
 */
export async function generateTextWithHistory(params: {
  messages: ConversationMessage[];
  config?: GenerateConfig;
}): Promise<GenerateTextResult> {
  return aiSdkService.generateTextWithHistory(params);
}

/**
 * Generate text with native web search
 *
 * @example
 * // Simple prompt
 * const result = await generateTextWithWebSearch({
 *   prompt: 'Latest AI news',
 *   config: { provider: AIProvider.GOOGLE }
 * });
 *
 * // With history
 * const result2 = await generateTextWithWebSearch({
 *   messages: [
 *     { role: 'system', content: 'Research assistant' },
 *     { role: 'user', content: 'Find info about Tesla' }
 *   ],
 *   config: { provider: AIProvider.OPENAI }
 * });
 */
export async function generateTextWithWebSearch(params: {
  prompt?: string;
  messages?: ConversationMessage[];
  config?: WebSearchConfig;
}): Promise<GenerateWithToolsResult> {
  return aiSdkService.generateTextWithWebSearch(params);
}

/**
 * Generate structured output using Zod schema
 *
 * @example
 * const UserSchema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 *   email: z.email()
 * });
 *
 * const result = await generateStructuredOutput({
 *   prompt: 'Create user: John, 30, john@example.com',
 *   schema: UserSchema,
 *   config: { provider: AIProvider.GOOGLE }
 * });
 */
export async function generateStructuredOutput<T = any>(params: {
  prompt?: string;
  messages?: ConversationMessage[];
  schema: z.ZodType<T>;
  config?: GenerateStructuredConfig;
}): Promise<GenerateStructuredResult<T>> {
  return aiSdkService.generateStructuredOutput(params);
}

/**
 * Generate structured output with web search (two-step process)
 *
 * @example
 * const CompanySchema = z.object({
 *   name: z.string(),
 *   industry: z.string(),
 *   website: z.string()
 * });
 *
 * const result = await generateStructuredOutputWithWebSearch({
 *   prompt: 'Research Acme Corporation and extract key details',
 *   schema: CompanySchema,
 *   config: { provider: AIProvider.GOOGLE }
 * });
 */
export async function generateStructuredOutputWithWebSearch<T = any>(params: {
  prompt?: string;
  messages?: ConversationMessage[];
  schema: z.ZodType<T>;
  config?: WebSearchConfig & GenerateStructuredConfig;
}): Promise<GenerateStructuredResult<T> & { sources?: any; searchText: string }> {
  return aiSdkService.generateStructuredOutputWithWebSearch(params);
}

/**
 * Stream text generation
 *
 * @example
 * // Simple prompt
 * const stream = await streamText({
 *   prompt: 'Write a story',
 *   config: { provider: AIProvider.ANTHROPIC }
 * });
 *
 * for await (const chunk of stream.textStream) {
 *   console.log(chunk);
 * }
 *
 * // With history
 * const stream2 = await streamText({
 *   messages: [
 *     { role: 'user', content: 'Tell me a joke' }
 *   ]
 * });
 */
export async function streamText(params: {
  prompt?: string;
  messages?: ConversationMessage[];
  config?: GenerateConfig;
}): Promise<GenerateTextStreamResult> {
  return aiSdkService.streamText(params);
}
