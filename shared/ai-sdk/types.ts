import { z } from "zod";

/**
 * Supported AI providers
 */
export enum AIProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
}

/**
 * Temperature presets for different use cases
 * Range: 0.1 to 2.0 (values above 1.0 may reduce coherence)
 *
 * Low (0.1-0.5): Focused and deterministic outputs
 * - DETERMINISTIC: 0.1 - Maximum consistency, minimal creativity
 * - FOCUSED: 0.2 - Very consistent with slight variation
 * - PRECISE: 0.3 - For structured outputs and analysis
 * - CONTROLLED: 0.4 - Predictable with some flexibility
 * - BALANCED: 0.5 - For general purpose tasks
 *
 * Medium (0.6-1.0): Creative with coherence
 * - FLEXIBLE: 0.6 - More varied responses with good coherence
 * - EXPRESSIVE: 0.7 - Enhanced creativity while maintaining relevance
 * - CREATIVE: 0.8 - For creative content generation
 * - IMAGINATIVE: 0.9 - High creativity and diversity
 * - BOLD: 1.0 - Maximum safe creativity
 *
 * High (1.2-2.0): Experimental (use with caution - may reduce coherence)
 * - ADVENTUROUS: 1.2 - Very high randomness for brainstorming
 * - WILD: 1.5 - Extreme creativity for experimental outputs
 * - CHAOTIC: 1.8 - Near-maximum randomness (coherence may suffer)
 * - EXTREME: 2.0 - Maximum possible randomness (rarely recommended)
 */
export enum TemperaturePreset {
  // Low: 0.1-0.5 (Focused and deterministic)
  DETERMINISTIC = 0.1,
  FOCUSED = 0.2,
  PRECISE = 0.3,
  CONTROLLED = 0.4,
  BALANCED = 0.5,

  // Medium: 0.6-1.0 (Creative with coherence)
  FLEXIBLE = 0.6,
  EXPRESSIVE = 0.7,
  CREATIVE = 0.8,
  IMAGINATIVE = 0.9,
  BOLD = 1.0,

  // High: 1.2-2.0 (Experimental - use with caution)
  ADVENTUROUS = 1.2,
  WILD = 1.5,
  CHAOTIC = 1.8,
  EXTREME = 2.0,
}

/**
 * Max tokens presets for different response lengths
 * - SHORT: 1000 - For brief responses
 * - MEDIUM: 4096 - For standard responses (cost-effective)
 * - LONG: 8192 - For comprehensive outputs
 * - EXTENDED: 16384 - For very long outputs (use sparingly)
 */
export enum MaxTokensPreset {
  SHORT = 1000,
  MEDIUM = 4096,
  LONG = 8192,
  EXTENDED = 16384,
}

/**
 * Temperature constants
 */
export const TEMPERATURE = {
  DETERMINISTIC: 0.1,
  FOCUSED: 0.2,
  PRECISE: 0.3,
  CONTROLLED: 0.4,
  BALANCED: 0.5,
  FLEXIBLE: 0.6,
  EXPRESSIVE: 0.7,
  CREATIVE: 0.8,
  IMAGINATIVE: 0.9,
  BOLD: 1.0,
  ADVENTUROUS: 1.2,
  WILD: 1.5,
  CHAOTIC: 1.8,
  EXTREME: 2.0,
};

/**
 * Max tokens constants
 */
export const MAX_TOKENS = {
  SHORT: 1000,
  MEDIUM: 4096,
  LONG: 8192,
  EXTENDED: 16384,
};

/**
 * Common model identifiers across providers
 * Only includes the latest models as of October 2025
 */
export enum AIModel {
  // OpenAI models (October 2025)
  GPT_5 = "gpt-5",
  GPT_5_MINI = "gpt-5-mini",
  GPT_5_NANO = "gpt-5-nano",

  // Anthropic models (October 2025)
  CLAUDE_SONNET_4_5 = "claude-sonnet-4-5-20250929",
  CLAUDE_OPUS_4_1 = "claude-opus-4-1-20250805",
  CLAUDE_HAIKU_4_5 = "claude-haiku-4-5-20251001",

  // Google models (October 2025)
  GEMINI_2_5_PRO = "gemini-2.5-pro",
  GEMINI_2_5_FLASH = "gemini-2.5-flash",
  GEMINI_2_5_FLASH_LITE = "gemini-2.5-flash-lite",
}

/**
 * Provider string constants (for backward compatibility)
 */
export const OPENAI_PROVIDER = AIProvider.OPENAI;
export const ANTHROPIC_PROVIDER = AIProvider.ANTHROPIC;
export const GEMINI_PROVIDER = AIProvider.GOOGLE;

/**
 * Default model constants (for backward compatibility)
 */
export const DEFAULT_OPENAI_MODEL = AIModel.GPT_5_MINI;
export const DEFAULT_ANTHROPIC_MODEL = AIModel.CLAUDE_HAIKU_4_5;
export const DEFAULT_GEMINI_MODEL = AIModel.GEMINI_2_5_FLASH;

/**
 * Default AI provider and model
 */
export const DEFAULT_AI_PROVIDER = AIProvider.GOOGLE;
export const DEFAULT_AI_MODEL = AIModel.GEMINI_2_5_FLASH;

/**
 * Type alias for supported AI models (backward compatibility)
 */
export type SupportedAIModel = AIModel | string;

/**
 * Provider-model configuration mapping
 */
export const PROVIDER_MODEL_CONFIG = {
  [AIProvider.OPENAI]: {
    default: DEFAULT_OPENAI_MODEL,
    supported: [AIModel.GPT_5, AIModel.GPT_5_MINI, AIModel.GPT_5_NANO] as const,
  },
  [AIProvider.ANTHROPIC]: {
    default: DEFAULT_ANTHROPIC_MODEL,
    supported: [
      AIModel.CLAUDE_SONNET_4_5,
      AIModel.CLAUDE_OPUS_4_1,
      AIModel.CLAUDE_HAIKU_4_5,
    ] as const,
  },
  [AIProvider.GOOGLE]: {
    default: DEFAULT_GEMINI_MODEL,
    supported: [
      AIModel.GEMINI_2_5_PRO,
      AIModel.GEMINI_2_5_FLASH,
      AIModel.GEMINI_2_5_FLASH_LITE,
    ] as const,
  },
} as const;

/**
 * Message role types - enum is the single source of truth
 */
export enum AIRoles {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
  TOOL = "tool",
}

/**
 * Derive the type from the enum values (no duplication)
 */
export type MessageRole = `${AIRoles}`;

const AIRolesValues = Object.values(AIRoles);

/**
 * Enum values for Zod validation
 */
const AIProviderValues = Object.values(AIProvider) as [string, ...string[]];
const AIModelValues = Object.values(AIModel) as [string, ...string[]];

/**
 * Conversation message structure
 */
export interface ConversationMessage {
  role: MessageRole;
  content: string;
}

/**
 * Configuration for AI generation
 */
export interface GenerateConfig {
  provider?: AIProvider;
  model?: AIModel | string;
  /**
   * Temperature controls randomness in responses
   * - Use TemperaturePreset enum for common values
   * - Or provide a custom number between 0 and 2
   * @example
   * temperature: TemperaturePreset.PRECISE // 0.3
   * temperature: 0.7 // custom value
   */
  temperature?: TemperaturePreset | number;
  /**
   * Maximum tokens to generate in response
   * - Use MaxTokensPreset enum for common values
   * - Or provide a custom number
   * @example
   * maxTokens: MaxTokensPreset.MEDIUM // 4096
   * maxTokens: 2000 // custom value
   */
  maxTokens?: MaxTokensPreset | number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  /**
   * Conversation ID for managing persistent conversations
   * - For OpenAI: Uses Responses API with server-side persistence
   * - For others: Uses local conversation manager with message arrays
   */
  conversationId?: string;
}

/**
 * Result from text generation
 */
export interface GenerateTextResult {
  text: string;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /**
   * Conversation ID for continuing the conversation
   * Use this ID in subsequent calls to maintain context
   */
  conversationId?: string;
  /**
   * For OpenAI: Thread ID from Responses API
   */
  threadId?: string;
  rawResponse?: unknown;
}

/**
 * Result from streaming text generation
 */
export interface GenerateTextStreamResult {
  textStream: ReadableStream<string>;
  fullTextPromise: Promise<string>;
  usage: Promise<{
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }>;
}

/**
 * Tool call result
 */
export interface ToolCallResult {
  toolName: string;
  args: unknown;
  result: unknown;
}

/**
 * Configuration for web search
 */
export interface WebSearchConfig extends GenerateConfig {
  /**
   * Maximum number of web searches the AI can perform
   * Only applicable for Anthropic provider
   */
  maxSearchUses?: number;
  /**
   * Search context size for OpenAI provider
   * Controls how much context is retrieved from web searches
   */
  searchContextSize?: "low" | "medium" | "high";
}

/**
 * Configuration for structured output generation
 */
export interface GenerateStructuredConfig extends GenerateConfig {
  /**
   * Optional name for the schema (helps the AI understand the purpose)
   */
  schemaName?: string;
  /**
   * Optional description for the schema (provides additional context)
   */
  schemaDescription?: string;
}

/**
 * Result from structured output generation
 */
export interface GenerateStructuredResult<T> {
  object: T;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  rawResponse?: unknown;
}

/**
 * Result from generation with tools
 */
export interface GenerateWithToolsResult extends GenerateTextResult {
  toolCalls: ToolCallResult[];
  steps: Array<{
    type: "tool-call" | "text";
    content: string | ToolCallResult;
  }>;
  /**
   * Sources from web search (available for OpenAI and Gemini)
   * Contains information about the web pages that were searched
   */
  sources?: any[];
}

/**
 * Zod schema for generate config validation
 */
export const GenerateConfigSchema = z.object({
  provider: z.enum(AIProviderValues).optional(),
  model: z.union([z.enum(AIModelValues), z.string()]).optional(),
  temperature: z
    .union([
      z.union([
        z.literal(0.1),
        z.literal(0.2),
        z.literal(0.3),
        z.literal(0.4),
        z.literal(0.5),
        z.literal(0.6),
        z.literal(0.7),
        z.literal(0.8),
        z.literal(0.9),
        z.literal(1.0),
        z.literal(1.2),
        z.literal(1.5),
        z.literal(1.8),
        z.literal(2.0),
      ]),
      z.number().min(0).max(2),
    ])
    .optional()
    .describe("Temperature preset or custom value (0-2)"),
  maxTokens: z
    .union([
      z.union([z.literal(1000), z.literal(4096), z.literal(8192), z.literal(16384)]),
      z.number().positive(),
    ])
    .optional()
    .describe("Max tokens preset or custom value"),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stopSequences: z.array(z.string()).optional(),
  conversationId: z.string().optional(),
});

/**
 * Zod schema for conversation message validation
 */
export const ConversationMessageSchema = z.object({
  role: z.enum(AIRolesValues),
  content: z.string(),
});


