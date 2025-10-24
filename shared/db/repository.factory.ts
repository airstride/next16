/**
 * Repository Factory
 *
 * Factory for creating repository instances based on configuration.
 * This enables true database agnosticism - you can switch databases
 * by changing an environment variable.
 *
 * Usage:
 *   const repo = RepositoryFactory.create<UserDocument>("User");
 *   // Returns MongooseRepository if DB_TYPE=mongodb
 *   // Returns SQLRepository if DB_TYPE=postgres
 *
 * Configuration:
 *   Set DATABASE_TYPE environment variable to:
 *   - "mongodb" (default) - Uses Mongoose
 *   - "postgres" - Uses TypeORM/Prisma (future)
 *   - "mysql" - Uses TypeORM/Prisma (future)
 */

import { IRepository } from "./repository.interface";
import { MongooseRepository } from "./mongoose.repository";
import { IEntity } from "@/shared/types/repository.types";
import { Document, Types } from "mongoose";

/**
 * Supported database types
 */
export type DatabaseType = "mongodb" | "postgres" | "mysql" | "sqlite";

/**
 * RepositoryFactory
 *
 * Singleton factory that creates appropriate repository implementations
 * based on the configured database type.
 */
export class RepositoryFactory {
  private static dbType: DatabaseType =
    (process.env.DATABASE_TYPE as DatabaseType) || "mongodb";

  /**
   * Create a repository instance for the given model/entity
   * @param modelName - Name of the model/entity
   * @returns Repository implementation for the configured database
   */
  static create<TEntity extends IEntity<Types.ObjectId> & Document>(
    modelName: string
  ): IRepository<TEntity, Types.ObjectId> {
    switch (this.dbType) {
      case "mongodb":
        return new MongooseRepository<TEntity>(modelName);

      case "postgres":
      case "mysql":
      case "sqlite":
        throw new Error(
          `Database type "${this.dbType}" is not yet implemented. ` +
            `To add support, create a repository implementation (e.g., SQLRepository) ` +
            `that implements IRepository and register it in this factory.`
        );

      default:
        throw new Error(
          `Unsupported database type: ${this.dbType}. ` +
            `Supported types: mongodb, postgres, mysql, sqlite`
        );
    }
  }

  /**
   * Set the database type (useful for testing)
   * @param type - Database type to use
   */
  static setDatabaseType(type: DatabaseType): void {
    this.dbType = type;
  }

  /**
   * Get the current database type
   * @returns Current database type
   */
  static getDatabaseType(): DatabaseType {
    return this.dbType;
  }

  /**
   * Check if a database type is supported
   * @param type - Database type to check
   * @returns True if supported and implemented
   */
  static isSupported(type: DatabaseType): boolean {
    return type === "mongodb";
    // When you add more implementations, expand this:
    // return ["mongodb", "postgres", "mysql"].includes(type);
  }
}
