import type { ConversationMessage } from "./types";

/**
 * Conversation state for OpenAI Responses API
 */
export interface OpenAIConversation {
  conversationId: string;
  threadId?: string;
  lastMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Conversation state for traditional message-based providers
 */
export interface MessageBasedConversation {
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Unified conversation state
 */
export type ConversationState =
  | { type: "openai"; data: OpenAIConversation }
  | { type: "message-based"; data: MessageBasedConversation };

/**
 * Conversation Manager
 * Handles conversation state for both OpenAI Responses API and traditional message-based approaches
 */
export class ConversationManager {
  private conversations: Map<string, ConversationState> = new Map();

  /**
   * Create a new OpenAI conversation (for use with Responses API)
   */
  createOpenAIConversation(
    conversationId: string,
    options?: {
      threadId?: string;
      metadata?: Record<string, unknown>;
    }
  ): OpenAIConversation {
    const conversation: OpenAIConversation = {
      conversationId,
      threadId: options?.threadId,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: options?.metadata,
    };

    this.conversations.set(conversationId, {
      type: "openai",
      data: conversation,
    });

    return conversation;
  }

  /**
   * Create a new message-based conversation (for Anthropic, Google, etc.)
   */
  createMessageBasedConversation(
    conversationId: string,
    initialMessages: ConversationMessage[] = [],
    metadata?: Record<string, unknown>
  ): MessageBasedConversation {
    const conversation: MessageBasedConversation = {
      messages: initialMessages,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata,
    };

    this.conversations.set(conversationId, {
      type: "message-based",
      data: conversation,
    });

    return conversation;
  }

  /**
   * Get a conversation by ID
   */
  getConversation(conversationId: string): ConversationState | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Update OpenAI conversation with new response data
   */
  updateOpenAIConversation(
    conversationId: string,
    updates: Partial<Omit<OpenAIConversation, "conversationId" | "createdAt">>
  ): void {
    const existing = this.conversations.get(conversationId);
    if (!existing || existing.type !== "openai") {
      throw new Error(`OpenAI conversation ${conversationId} not found`);
    }

    this.conversations.set(conversationId, {
      type: "openai",
      data: {
        ...existing.data,
        ...updates,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Add messages to a message-based conversation
   */
  addMessages(conversationId: string, messages: ConversationMessage[]): void {
    const existing = this.conversations.get(conversationId);
    if (!existing || existing.type !== "message-based") {
      throw new Error(`Message-based conversation ${conversationId} not found`);
    }

    this.conversations.set(conversationId, {
      type: "message-based",
      data: {
        ...existing.data,
        messages: [...existing.data.messages, ...messages],
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get messages from a message-based conversation
   */
  getMessages(conversationId: string): ConversationMessage[] {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || conversation.type !== "message-based") {
      return [];
    }
    return conversation.data.messages;
  }

  /**
   * Delete a conversation
   */
  deleteConversation(conversationId: string): boolean {
    return this.conversations.delete(conversationId);
  }

  /**
   * Clear all conversations
   */
  clearAll(): void {
    this.conversations.clear();
  }

  /**
   * Get all conversation IDs
   */
  getAllConversationIds(): string[] {
    return Array.from(this.conversations.keys());
  }

  /**
   * Check if a conversation exists
   */
  hasConversation(conversationId: string): boolean {
    return this.conversations.has(conversationId);
  }

  /**
   * Get conversation count
   */
  getConversationCount(): number {
    return this.conversations.size;
  }
}

/**
 * Default singleton instance
 */
export const conversationManager = new ConversationManager();
