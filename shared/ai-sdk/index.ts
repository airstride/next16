/**
 * AI SDK Abstraction Layer
 *
 * Provides a unified interface for working with multiple AI providers
 * (OpenAI, Anthropic, Google) through the Vercel AI SDK.
 *
 * @example
 * ```typescript
 * import { generateText, AIProvider, AIModel } from '@/lib/ai-sdk';
 *
 * const result = await generateText({
 *   prompt: 'What is love?',
 *   config: {
 *     provider: AIProvider.OPENAI,
 *     model: AIModel.GPT_4O
 *   }
 * });
 * ```
 */

// Export service and class
export { AISdkService, aiSdkService } from "./ai.sdk.service";
import { ModelMessage } from "ai";

// Export conversation manager
export {
  ConversationManager,
  conversationManager,
  type OpenAIConversation,
  type MessageBasedConversation,
  type ConversationState,
} from "./conversation.manager";

// Export convenience functions
export {
  generateText,
  generateTextWithHistory,
  generateTextWithWebSearch,
  generateStructuredOutput,
  generateStructuredOutputWithWebSearch,
  streamText,
  streamStructuredOutput,
  streamStructuredOutputWithWebSearch,
} from "./ai.sdk.service";

// Export types and enums
export {
  AIProvider,
  AIModel,
  AIRoles,
  TemperaturePreset,
  MaxTokensPreset,
  StreamEventType,
  TEMPERATURE,
  MAX_TOKENS,
  OPENAI_PROVIDER,
  ANTHROPIC_PROVIDER,
  GEMINI_PROVIDER,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_AI_PROVIDER,
  DEFAULT_AI_MODEL,
  PROVIDER_MODEL_CONFIG,
  type SupportedAIModel,
  type MessageRole,
  type ConversationMessage,
  type GenerateConfig,
  type GenerateStructuredConfig,
  type GenerateTextResult,
  type GenerateTextStreamResult,
  type GenerateStructuredResult,
  type GenerateStructuredStreamResult,
  type StreamEvent,
  type StreamStructuredConfig,
  type ToolCallResult,
  type WebSearchConfig,
  type GenerateWithToolsResult,
  GenerateConfigSchema,
  ConversationMessageSchema,
} from "./types";

export type { ModelMessage };
