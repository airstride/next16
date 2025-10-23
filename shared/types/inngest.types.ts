/**
 * Base event structure that all Inngest events must extend
 * This ensures type safety and consistency across the event-driven system
 */

/**
 * Base metadata included in every event
 */
export interface BaseEventMetadata {
  /** ISO 8601 timestamp when the event was created */
  timestamp: string;
  
  /** User ID who triggered the event (if applicable) */
  userId?: string;
  
  /** Project ID associated with the event */
  projectId: string;
  
  /** Event schema version for backwards compatibility */
  version: string;
  
  /** 
   * Unique event identifier - used for deduplication and tracing
   * If not provided, will be auto-generated
   */
  eventId: string;
  
  /** 
   * Idempotency key - ensures exactly-once processing even if event is sent multiple times
   * Format: `{projectId}:{eventType}:{resourceId}:{operation}`
   * Example: `proj_123:task:task_456:update`
   */
  idempotencyKey?: string;
  
  /** 
   * Connection/Session ID - tracks which client connection triggered this event
   * Useful for concurrent operations and request tracing
   */
  connectionId?: string;
  
  /** 
   * Correlation ID for tracing related events across the system
   * Use the same correlationId for all events in a logical flow
   * Example: project.created → plan.generated → task.created all share same correlationId
   */
  correlationId?: string;
  
  /** Source system or module that emitted the event */
  source: string;
  
  /** 
   * Retry attempt number (0 for first attempt)
   * Automatically incremented by Inngest on retries
   */
  retryCount?: number;
}

/**
 * Base event structure that all events must follow
 * @template TName - The event name as a string literal
 * @template TData - The event-specific payload type
 */
export interface BaseEvent<TName extends string = string, TData = unknown> {
  /** Event name - use dot notation (e.g., 'project.created') */
  name: TName;
  /** Event-specific payload data */
  data: TData;
  /** Standard metadata for all events */
  metadata: BaseEventMetadata;
}

/**
 * Helper type to extract event data type from an event
 */
export type EventData<T extends BaseEvent> = T['data'];

/**
 * Helper type to extract event name from an event
 */
export type EventName<T extends BaseEvent> = T['name'];

/**
 * Utility function to create a properly typed event
 * @param name - Event name
 * @param data - Event payload
 * @param metadata - Event metadata (partial, will be merged with defaults)
 */
export function createEvent<TName extends string, TData>(
  name: TName,
  data: TData,
  metadata: Partial<BaseEventMetadata> & Pick<BaseEventMetadata, 'projectId' | 'source'>
): BaseEvent<TName, TData> {
  const timestamp = new Date().toISOString();
  const eventId = metadata.eventId || generateEventId(name, timestamp);
  
  return {
    name,
    data,
    metadata: {
      timestamp,
      version: '1.0',
      eventId,
      retryCount: 0,
      ...metadata,
    },
  };
}

/**
 * Generate a unique event ID
 * Format: {eventName}_{timestamp}_{random}
 */
function generateEventId(eventName: string, timestamp: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const cleanTimestamp = timestamp.replace(/[:.]/g, '').substring(0, 17);
  return `${eventName}_${cleanTimestamp}_${randomSuffix}`;
}

/**
 * Generate an idempotency key for exactly-once processing
 * @param projectId - Project identifier
 * @param eventType - Type of event
 * @param resourceId - Resource being acted upon
 * @param operation - Operation being performed
 */
export function createIdempotencyKey(
  projectId: string,
  eventType: string,
  resourceId: string,
  operation?: string
): string {
  const parts = [projectId, eventType, resourceId];
  if (operation) parts.push(operation);
  return parts.join(':');
}

/**
 * Type guard to check if an object is a valid BaseEvent
 */
export function isBaseEvent(obj: unknown): obj is BaseEvent {
  if (typeof obj !== 'object' || obj === null) return false;
  const event = obj as Record<string, unknown>;
  
  return (
    typeof event.name === 'string' &&
    event.data !== undefined &&
    typeof event.metadata === 'object' &&
    event.metadata !== null
  );
}

/**
 * Inngest function configuration for concurrency and idempotency
 * Use this as a base for all Inngest function configurations
 */
export interface InngestFunctionConfig {
  /** Function identifier - must be unique across your application */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** 
   * Concurrency limit - max number of this function that can run simultaneously
   * Default: undefined (no limit)
   * Recommended: Set based on external API rate limits or database connection pools
   */
  concurrency?: number | {
    /** Maximum concurrent executions */
    limit: number;
    /** Key to use for concurrency grouping (e.g., by projectId) */
    key?: string;
  };
  
  /** 
   * Idempotency configuration
   * Inngest automatically handles idempotency based on event.id by default
   */
  idempotency?: {
    /** Time window for idempotency (default: 24 hours) */
    period: string; // e.g., "24h", "7d"
  };
  
  /** 
   * Retry configuration
   * Inngest automatically retries failed functions with exponential backoff
   */
  retry?: {
    /** Maximum number of retry attempts (default: 3) */
    attempts?: number;
  };
  
  /** 
   * Rate limiting configuration
   * Limits how often this function can be triggered
   */
  rateLimit?: {
    /** Maximum executions per time window */
    limit: number;
    /** Time window (e.g., "1m", "1h") */
    period: string;
    /** Key for rate limit grouping (e.g., by userId or projectId) */
    key?: string;
  };
  
  /**
   * Debounce configuration
   * Useful for batching rapid events (e.g., multiple rapid updates)
   */
  debounce?: {
    /** Time to wait before executing (e.g., "5s", "1m") */
    period: string;
    /** Key for debounce grouping */
    key?: string;
  };
}

/**
 * Create a safe idempotent operation wrapper
 * This ensures operations can be safely retried without side effects
 * 
 * @example
 * const result = await withIdempotency(
 *   'task_123_update',
 *   async () => await updateTask(taskId, data)
 * );
 */
export async function withIdempotency<T>(
  idempotencyKey: string,
  operation: () => Promise<T>,
  cache?: Map<string, T>
): Promise<T> {
  // In production, you'd use Redis or similar for distributed idempotency
  // For now, this demonstrates the pattern
  const resultCache = cache || new Map<string, T>();
  
  if (resultCache.has(idempotencyKey)) {
    return resultCache.get(idempotencyKey)!;
  }
  
  const result = await operation();
  resultCache.set(idempotencyKey, result);
  
  return result;
}

