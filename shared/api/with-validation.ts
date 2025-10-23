/**
 * withValidation Higher-Order Functions
 *
 * Provides request validation using Zod schemas with support for:
 * - JSON body validation
 * - JSON Patch (RFC 6902) for PATCH requests
 * - Detailed validation error responses
 *
 * @example
 * ```typescript
 * import { z } from "zod";
 * import { withAuth, withDB, withValidation } from "@/shared/api";
 *
 * const createUserSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 * });
 *
 * export const POST = withAuth(
 *   withDB(
 *     withValidation(createUserSchema, async (req, ctx, { auth, body }) => {
 *       // body is fully typed and validated
 *       const user = await UserService.create(auth.userId, body, auth.activeOrgId);
 *       return successResponse({ user });
 *     })
 *   )
 * );
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { CoreHandler, NextRouteContext } from "@/shared/types/api-hof.types";
import { ValidationError } from "@/shared/utils/errors";

/**
 * Validate request body against a Zod schema
 *
 * @param body - The request body to validate
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data
 * @throws ValidationError with field-level error details
 */
async function validate<T>(body: unknown, schema: z.ZodSchema<T>): Promise<T> {
  const result = await schema.safeParseAsync(body);

  if (!result.success) {
    // Convert Zod errors to field-level error map
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    const keys = Object.keys(fieldErrors);
    const generalMessage =
      keys.length === 1
        ? `Validation failed for ${keys[0]}`
        : `Validation failed for ${keys.length} field(s)`;

    throw ValidationError.fromZod(result.error, generalMessage);
  }

  return result.data;
}

/**
 * Higher-order function for validating request bodies
 *
 * @param schema - Zod schema to validate the request body against
 * @param handler - Route handler that receives the validated body
 * @returns Wrapped handler with validation
 */
export function withValidation<
  TInput,
  P extends Record<string, string> = Record<string, string>,
  ExistingProps extends Record<string, any> = Record<string, any>,
>(
  schema: z.ZodSchema<TInput>,
  handler: CoreHandler<P, ExistingProps & { body: TInput }>
): CoreHandler<P, ExistingProps> {
  return async (
    req: NextRequest,
    context: NextRouteContext<P>,
    props: ExistingProps
  ): Promise<Response> => {
    try {
      const raw = await req.json();
      const body = await validate<TInput>(raw, schema);

      const mergedProps = { ...props, body };

      return handler(req, context, mergedProps);
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json(err.toJSON(), { status: 400 });
      }

      // Unexpected error during validation
      console.error("Unexpected error in withValidation:", err);

      const validationError = new ValidationError(
        "Failed to parse request body",
        err instanceof Error ? err.message : String(err)
      );

      return NextResponse.json(validationError.toJSON(), { status: 400 });
    }
  };
}

/**
 * JSON Patch operation type (RFC 6902)
 */
export type JsonPatchOperation = {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: any;
  from?: string;
};

/**
 * Check if request body is a JSON Patch array
 */
function isJsonPatchRequest(body: unknown): body is JsonPatchOperation[] {
  return (
    Array.isArray(body) &&
    body.length > 0 &&
    body.every(
      (op) =>
        typeof op === "object" &&
        op !== null &&
        "op" in op &&
        "path" in op &&
        typeof op.op === "string" &&
        typeof op.path === "string"
    )
  );
}

/**
 * Convert JSON Patch operations to a partial update object
 *
 * @param operations - Array of JSON Patch operations
 * @returns Partial update object suitable for validation
 */
function applyJsonPatchToPartial(operations: JsonPatchOperation[]): Record<string, any> {
  const updateData: Record<string, any> = {};

  for (const operation of operations) {
    if (operation.op === "replace" || operation.op === "add") {
      // Convert path like "/name" or "/address/city" to nested object
      const pathParts = operation.path.split("/").filter(Boolean);

      let current = updateData;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      const finalKey = pathParts[pathParts.length - 1];
      current[finalKey] = operation.value;
    } else if (operation.op === "remove") {
      // For remove operations, set value to null or undefined
      const pathParts = operation.path.split("/").filter(Boolean);

      let current = updateData;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      const finalKey = pathParts[pathParts.length - 1];
      current[finalKey] = null;
    }
    // Note: move, copy, and test operations are more complex
    // and may require the original document - not implemented here
  }

  return updateData;
}

/**
 * Higher-order function for validating PATCH requests
 * Supports both JSON Patch operations (RFC 6902) and regular partial update objects
 *
 * @param schema - Zod schema to validate the processed update data against
 * @param handler - Route handler that receives the validated patch data
 * @returns Wrapped handler with PATCH validation
 */
export function withPatchValidation<
  TInput,
  P extends Record<string, string> = Record<string, string>,
  ExistingProps extends Record<string, any> = Record<string, any>,
>(
  schema: z.ZodSchema<TInput>,
  handler: CoreHandler<P, ExistingProps & { body: TInput }>
): CoreHandler<P, ExistingProps> {
  return async (
    req: NextRequest,
    context: NextRouteContext<P>,
    props: ExistingProps
  ): Promise<Response> => {
    try {
      const raw = await req.json();

      let updateData: Record<string, any>;

      // Check if the request body is JSON Patch format
      if (isJsonPatchRequest(raw)) {
        // Apply JSON Patch operations to create a partial update object
        updateData = applyJsonPatchToPartial(raw);
      } else {
        // Treat as regular partial update object
        updateData = raw;
      }

      // Validate the processed update data against the schema
      const body = await validate<TInput>(updateData, schema);

      return handler(req, context, { ...props, body });
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json(err.toJSON(), { status: 400 });
      }

      console.error("Unexpected error in withPatchValidation:", err);

      const validationError = new ValidationError(
        "Failed to parse PATCH request",
        err instanceof Error ? err.message : String(err)
      );

      return NextResponse.json(validationError.toJSON(), { status: 400 });
    }
  };
}

