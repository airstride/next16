/**
 * Error Handling System
 *
 * Provides a consistent error structure across the entire application.
 * All errors extend BaseError and serialize to the IErrorResponse interface.
 */

import { IErrorResponse } from "../types/api.types";
import { logger } from "./logger";

/**
 * BaseError
 *
 * Foundation for all custom errors in the application.
 * Extends native Error with HTTP status codes and metadata.
 */
export abstract class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly metadata?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    metadata?: Record<string, unknown>
  ) {
    super(message);

    // Maintains proper stack trace for where error was thrown (only available on V8)
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Serialize error to standard API response format
   */
  toJSON(): IErrorResponse {
    return {
      message: this.message,
      details: this.metadata as Record<string, string[] | string>,
    };
  }

  /**
   * Log the error with appropriate context
   */
  log(): void {
    logger.error(`[${this.name}] ${this.message}`, {
      statusCode: this.statusCode,
      metadata: this.metadata,
      stack: this.stack,
      timestamp: this.timestamp,
    });
  }
}

/**
 * ValidationError (400)
 *
 * Thrown when input validation fails (Zod, request body, query params)
 */
export class ValidationError extends BaseError {
  constructor(
    message: string = "Validation failed",
    metadata?: Record<string, unknown>
  ) {
    super(message, 400, true, metadata);
  }

  /**
   * Create ValidationError from Zod error
   */
  static fromZod(zodError: {
    errors?: Array<{ path: Array<string | number>; message: string }>;
  }): ValidationError {
    const details: Record<string, string[]> = {};

    if (zodError.errors) {
      zodError.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!details[path]) {
          details[path] = [];
        }
        details[path].push(err.message);
      });
    }

    return new ValidationError("Validation failed", { errors: details });
  }
}

/**
 * AuthenticationError (401)
 *
 * Thrown when authentication is missing or invalid
 */
export class AuthenticationError extends BaseError {
  constructor(
    message: string = "Authentication required",
    metadata?: Record<string, unknown>
  ) {
    super(message, 401, true, metadata);
  }
}

/**
 * AuthorizationError (403)
 *
 * Thrown when user lacks permission for requested resource/action
 */
export class AuthorizationError extends BaseError {
  constructor(
    message: string = "Insufficient permissions",
    metadata?: Record<string, unknown>
  ) {
    super(message, 403, true, metadata);
  }
}

/**
 * NotFoundError (404)
 *
 * Thrown when requested resource doesn't exist
 */
export class NotFoundError extends BaseError {
  constructor(
    resource: string = "Resource",
    metadata?: Record<string, unknown>
  ) {
    super(`${resource} not found`, 404, true, metadata);
  }
}

/**
 * ConflictError (409)
 *
 * Thrown when resource already exists or conflicts with current state
 */
export class ConflictError extends BaseError {
  constructor(
    message: string = "Resource conflict",
    metadata?: Record<string, unknown>
  ) {
    super(message, 409, true, metadata);
  }
}

/**
 * DatabaseError (500)
 *
 * Thrown when database operations fail (Mongoose errors)
 */
export class DatabaseError extends BaseError {
  constructor(
    message: string = "Database operation failed",
    metadata?: Record<string, unknown>
  ) {
    super(message, 500, true, metadata);
  }

  /**
   * Create DatabaseError from Mongoose error
   */
  static fromMongoose(mongooseError: {
    code?: number;
    name?: string;
    keyPattern?: Record<string, unknown>;
    errors?: Record<string, { message: string }>;
    path?: string;
    value?: unknown;
    message?: string;
  }): DatabaseError {
    const metadata: Record<string, unknown> = {
      code: mongooseError.code,
      name: mongooseError.name,
    };

    // Handle duplicate key error
    if (mongooseError.code === 11000) {
      const field = Object.keys(mongooseError.keyPattern || {})[0];
      return new ConflictError(`Duplicate ${field}: already exists`, metadata);
    }

    // Handle validation error
    if (mongooseError.name === "ValidationError") {
      const errors: Record<string, string[]> = {};
      Object.keys(mongooseError.errors || {}).forEach((key) => {
        errors[key] = [
          mongooseError.errors?.[key]?.message || "Validation error",
        ];
      });
      return new ValidationError("Database validation failed", { errors });
    }

    // Handle cast error (invalid ObjectId, etc.)
    if (mongooseError.name === "CastError") {
      return new ValidationError(
        `Invalid ${mongooseError.path}: ${mongooseError.value}`,
        metadata
      );
    }

    return new DatabaseError(mongooseError.message, metadata);
  }
}

/**
 * ExternalServiceError (502)
 *
 * Thrown when external API/service calls fail
 * (PropelAuth, OpenAI, Anthropic, Inngest, etc.)
 */
export class ExternalServiceError extends BaseError {
  constructor(
    service: string,
    message: string = "External service error",
    metadata?: Record<string, unknown>
  ) {
    super(`${service}: ${message}`, 502, true, { service, ...metadata });
  }
}

/**
 * RateLimitError (429)
 *
 * Thrown when rate limits are exceeded
 */
export class RateLimitError extends BaseError {
  constructor(
    message: string = "Rate limit exceeded",
    metadata?: Record<string, unknown>
  ) {
    super(message, 429, true, metadata);
  }
}

/**
 * ServiceUnavailableError (503)
 *
 * Thrown when service is temporarily unavailable
 */
export class ServiceUnavailableError extends BaseError {
  constructor(
    message: string = "Service temporarily unavailable",
    metadata?: Record<string, unknown>
  ) {
    super(message, 503, true, metadata);
  }
}

/**
 * Error Handler
 *
 * Centralized error handling logic for API routes
 */
export class ErrorHandler {
  /**
   * Handle error and return appropriate Response
   */
  static handle(error: unknown): Response {
    // Handle BaseError instances
    if (error instanceof BaseError) {
      error.log();
      return new Response(JSON.stringify(error.toJSON()), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle Zod validation errors
    if (error && typeof error === "object" && "name" in error) {
      const err = error as { name: string; errors?: unknown };
      if (err.name === "ZodError" && "errors" in err) {
        const validationError = ValidationError.fromZod(
          err as Parameters<typeof ValidationError.fromZod>[0]
        );
        validationError.log();
        return new Response(JSON.stringify(validationError.toJSON()), {
          status: validationError.statusCode,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Handle Mongoose errors
    if (error && typeof error === "object" && "name" in error) {
      const err = error as { name?: string; code?: number };
      const errorName = err.name;
      if (
        errorName === "ValidationError" ||
        errorName === "CastError" ||
        err.code === 11000
      ) {
        const dbError = DatabaseError.fromMongoose(
          error as Parameters<typeof DatabaseError.fromMongoose>[0]
        );
        dbError.log();
        return new Response(JSON.stringify(dbError.toJSON()), {
          status: dbError.statusCode,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Handle native Error instances
    if (error instanceof Error) {
      logger.error("Unhandled error", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      const genericError: IErrorResponse = {
        message: "Internal server error",
        details: { error: error.message },
      };

      return new Response(JSON.stringify(genericError), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unknown errors
    logger.error("Unknown error type", { error });

    const genericError: IErrorResponse = {
      message: "Internal server error",
      details: { error: "An unexpected error occurred" },
    };

    return new Response(JSON.stringify(genericError), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Async error handler wrapper for route handlers
   */
  static async handleAsync(
    handler: () => Promise<Response>
  ): Promise<Response> {
    try {
      return await handler();
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  }
}

/**
 * Error Response Helpers
 *
 * Utility functions for creating error responses
 */
export const ErrorResponse = {
  /**
   * Create validation error response
   */
  validation: (
    message: string,
    errors?: Record<string, string[]>
  ): Response => {
    const error = new ValidationError(message, { errors });
    return ErrorHandler.handle(error);
  },

  /**
   * Create authentication error response
   */
  unauthorized: (message?: string): Response => {
    const error = new AuthenticationError(message);
    return ErrorHandler.handle(error);
  },

  /**
   * Create authorization error response
   */
  forbidden: (message?: string): Response => {
    const error = new AuthorizationError(message);
    return ErrorHandler.handle(error);
  },

  /**
   * Create not found error response
   */
  notFound: (resource?: string): Response => {
    const error = new NotFoundError(resource);
    return ErrorHandler.handle(error);
  },

  /**
   * Create conflict error response
   */
  conflict: (message: string): Response => {
    const error = new ConflictError(message);
    return ErrorHandler.handle(error);
  },

  /**
   * Create rate limit error response
   */
  rateLimit: (message?: string): Response => {
    const error = new RateLimitError(message);
    return ErrorHandler.handle(error);
  },

  /**
   * Create service unavailable error response
   */
  unavailable: (message?: string): Response => {
    const error = new ServiceUnavailableError(message);
    return ErrorHandler.handle(error);
  },
};

/**
 * Type guard to check if error is operational
 */
export function isOperationalError(error: unknown): boolean {
  return error instanceof BaseError && error.isOperational;
}
