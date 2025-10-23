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
} from "./ai.sdk.service";

// Export types and enums
export {
  AIProvider,
  AIModel,
  AIRoles,
  TemperaturePreset,
  MaxTokensPreset,
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
  type GenerateTextResult,
  type GenerateTextStreamResult,
  type ToolCallResult,
  type WebSearchConfig,
  type GenerateWithToolsResult,
  type ModelMessage,
  GenerateConfigSchema,
  ConversationMessageSchema,
} from "./types";

// Export tools
export { availableTools, getTools, calculatorTool } from "./tools";
