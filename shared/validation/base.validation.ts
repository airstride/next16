import { z } from "zod";
import { BrandedZodType } from "@/shared/types";

/**
 * Parse and brand data with a Zod schema
 *
 * This utility safely parses data and returns it as a branded type,
 * enabling nominal typing for validated inputs throughout the application.
 *
 * @template T - The Zod schema type
 * @template TBrand - The unique brand symbol
 * @param schema - The Zod schema to validate against
 * @param data - The data to parse
 * @returns Branded and validated data
 *
 * @example
 * ```typescript
 * const WebsiteUrlInputBrand = Symbol("WebsiteUrlInputBrand");
 * const WebsiteUrlInputSchema = z.object({ website_url: z.string().url() });
 * type WebsiteUrlInput = BrandedZodType<z.infer<typeof WebsiteUrlInputSchema>, typeof WebsiteUrlInputBrand>;
 *
 * const input = brandedParse<typeof WebsiteUrlInputSchema, typeof WebsiteUrlInputBrand>(
 *   WebsiteUrlInputSchema,
 *   { website_url: "https://example.com" }
 * );
 * ```
 */
export const brandedParse = <T extends z.ZodTypeAny, TBrand extends symbol>(
  schema: T,
  data: unknown
): BrandedZodType<z.infer<T>, TBrand> => {
  return schema.parse(data) as BrandedZodType<z.infer<T>, TBrand>;
};

/**
 * Base audit fields schema (for API responses with snake_case)
 */
export const BaseAuditFieldsSchema = z.object({
  created_at: z.date(),
  updated_at: z.date(),
  created_by: z.string().optional(),
  updated_by: z.string().optional(),
  created_by_propel_auth_org_id: z.string().optional(),
});

export type BaseAuditFields = z.infer<typeof BaseAuditFieldsSchema>;

/**
 * Soft delete fields schema
 */
export const SoftDeleteFieldsSchema = z.object({
  is_deleted: z.boolean().optional(),
  deleted_at: z.date().optional(),
  deleted_by: z.string().optional(),
});

export type SoftDeleteFields = z.infer<typeof SoftDeleteFieldsSchema>;

/**
 * User ownership fields schema
 */
export const UserOwnershipFieldsSchema = z.object({
  user_id: z.string(),
  organization_id: z.string().optional(),
});

export type UserOwnershipFields = z.infer<typeof UserOwnershipFieldsSchema>;

/**
 * Base entity response schema
 * All API response schemas should extend this
 */
export const BaseEntityResponseSchema = z
  .object({
    id: z.string(),
  })
  .merge(BaseAuditFieldsSchema);

export type BaseEntityResponse = z.infer<typeof BaseEntityResponseSchema>;

/**
 * Base user entity response schema
 * For entities with user ownership
 */
export const BaseUserEntityResponseSchema = BaseEntityResponseSchema.merge(
  UserOwnershipFieldsSchema
);

export type BaseUserEntityResponse = z.infer<
  typeof BaseUserEntityResponseSchema
>;

/**
 * Helper to create a response schema by extending base
 * @example
 * const ProjectResponseSchema = createResponseSchema(
 *   z.object({
 *     company: z.object({ name: z.string() }),
 *     product: z.object({ description: z.string() })
 *   })
 * );
 */
export const createResponseSchema = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
) => {
  return BaseUserEntityResponseSchema.merge(schema);
};

/**
 * Helper to create a create input schema
 * Automatically includes user_id and optional organization_id
 */
export const createInputSchema = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
) => {
  return schema.merge(
    z.object({
      user_id: z.string().min(1, "User ID is required"),
      organization_id: z.string().optional(),
    })
  );
};
