/**
 * Validation Types
 *
 * Types specific to validation layer (Zod schemas, input validation)
 * Separated from repository and API concerns
 */

/**
 * IZod - Nominal Typing Implementation
 *
 * A marker interface for "Zod‐validated input objects" with nominal typing support.
 * Uses Symbol generics to create distinct types that prevent accidental mixing
 * of different validation schemas, even if they have the same structure.
 *
 * @template TBrand - A unique symbol that serves as the type brand/tag
 *
 * @example
 * ```typescript
 * // Define unique brands for each schema
 * declare const UserCreateBrand: unique symbol;
 * declare const ProjectCreateBrand: unique symbol;
 *
 * // Create branded types
 * type UserCreateInput = z.infer<typeof userCreateSchema> & IZod<typeof UserCreateBrand>;
 * type ProjectCreateInput = z.infer<typeof projectCreateSchema> & IZod<typeof ProjectCreateBrand>;
 *
 * // These types are now incompatible even if they have the same structure
 * function createUser(input: UserCreateInput) { ... }
 * function createProject(input: ProjectCreateInput) { ... }
 *
 * // TypeScript will prevent mixing these types
 * const userInput: UserCreateInput = { name: "John" };
 * createProject(userInput); // ❌ Type error - prevents accidental misuse
 * ```
 */
export interface IZod<TBrand extends symbol = symbol> {
  readonly _brand: TBrand;
}

/**
 * Utility type to create a branded Zod validation type
 *
 * @template T - The inferred Zod schema type
 * @template TBrand - The unique symbol brand
 *
 * @example
 * ```typescript
 * declare const UserCreateBrand: unique symbol;
 *
 * const userCreateSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 *
 * type UserCreateInput = BrandedZodType<
 *   z.infer<typeof userCreateSchema>,
 *   typeof UserCreateBrand
 * >;
 * ```
 */
export type BrandedZodType<T, TBrand extends symbol> = T & {
  readonly _brand: TBrand;
};

