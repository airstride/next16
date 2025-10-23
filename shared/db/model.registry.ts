import { type Model, type Document } from "mongoose";

/**
 * Model Registry for modular architecture with type safety
 *
 * This registry allows modules to register their models without creating
 * circular dependencies. Common infrastructure doesn't need to know about
 * specific modules - modules register themselves.
 *
 * Dependencies flow correctly:
 * Modules (modules/deals) → Common Infrastructure (shared/db)
 *
 * Note: Model names are simple strings. Modular modules define their own
 * model name constants in their schema.ts file.
 */
class ModelRegistry {
  // Use `any` for Document type to allow any model shape while maintaining Model type safety
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private models = new Map<string, Model<any>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private lazyLoaders = new Map<string, () => Model<any>>();

  /**
   * Register a model with type safety
   * Modules call this to register their models with the common infrastructure
   * @param name - Model name (string constant from the module)
   * @param model - The Mongoose model with proper typing
   */
  register<T extends Document>(name: string, model: Model<T>): void {
    this.models.set(name, model);
  }

  /**
   * Register a lazy loader for models that need deferred initialization
   * Useful for avoiding circular dependencies or heavy initialization
   * @param name - Model name (from module's ModelNames constant)
   * @param loader - Function that returns the model when called
   */
  registerLazy<T extends Document>(name: string, loader: () => Model<T>): void {
    this.lazyLoaders.set(name, loader);
  }

  /**
   * Get a model by name with type safety
   * First checks registered models, then falls back to lazy loaders
   * @param name - Model name string
   * @returns The registered Mongoose model with proper typing
   */
  get<T extends Document = Document>(name: string): Model<T> {
    // Check if model is already registered
    if (this.models.has(name)) {
      return this.models.get(name)! as Model<T>;
    }

    // Check if we have a lazy loader for this model
    if (this.lazyLoaders.has(name)) {
      const loader = this.lazyLoaders.get(name)!;
      const model = loader();
      this.models.set(name, model); // Cache it
      return model as Model<T>;
    }

    throw new Error(
      `Model "${name}" not registered. Make sure the model is registered via modelRegistry.register() or modelRegistry.registerLazy()`
    );
  }

  /**
   * Check if a model is registered
   * @param name - Model name string
   * @returns True if the model is registered
   */
  has(name: string): boolean {
    return this.models.has(name) || this.lazyLoaders.has(name);
  }

  /**
   * Get all registered model names
   * @returns Array of all registered model name strings
   */
  getRegisteredNames(): string[] {
    return [...Array.from(this.models.keys()), ...Array.from(this.lazyLoaders.keys())];
  }

  /**
   * Clear all registered models (useful for testing)
   */
  clear(): void {
    this.models.clear();
    this.lazyLoaders.clear();
  }
}

// Singleton instance
export const modelRegistry = new ModelRegistry();
