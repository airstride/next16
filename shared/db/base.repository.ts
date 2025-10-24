import { Document, FilterQuery, Model, Types } from "mongoose";
import { modelRegistry } from "@/shared/db/model.registry";
import {
  CloneOperationResult,
  CloneToCollectionOptions,
} from "@/shared/types/clone.types";
import {
  BulkWriteResult,
  EntityFilter,
  IEntity,
  QueryOptions,
} from "@/shared/types/repository.types";

/**
 * BaseRepository
 *
 * A generic, abstract repository class for Mongoose models, providing
 * reusable CRUD operations and soft-delete logic. This class is designed
 * for extensibility and encapsulation, following OOP best practices.
 *
 * Type Parameters:
 *   TEntity - The entity document type (must extend IEntity and Mongoose Document).
 *
 * Usage:
 *   - Extend this class for each entity/model to inherit base CRUD logic.
 *   - Compose with custom methods for entity-specific logic.
 *
 * Key Methods:
 *   - create(doc): Create a new document.
 *   - find(filter, options): Find all non-deleted documents with optional pagination.
 *   - findOne(filter): Find a single non-deleted document by filter.
 *   - findById(id): Find a single non-deleted document by its ID.
 *   - updateById(id, update): Update a non-deleted document by its ID.
 *   - softDelete(id): Soft-delete a document (set is_deleted=true).
 *   - count(filter): Count non-deleted documents matching a filter.
 *   - validateId(id): Validate a MongoDB ObjectId string.
 *   - cloneToCollection(targetCollection, options): Clone documents to another collection.

 */
export class BaseRepository<TEntity extends IEntity<Types.ObjectId> & Document>
  implements
    Partial<{
      create: any;
      find: any;
      findOne: any;
      updateById: any;
      findWithPopulate: any;
      count: any;
    }>
{
  protected model: Model<TEntity>;

  /**
   * Constructor - Gets the model from the singleton registry
   * @param modelName - The registered name of the model
   */
  constructor(modelName: string) {
    // Use the singleton registry to get the model
    // Models should already be initialized by DatabaseService
    this.model = modelRegistry.get<TEntity>(modelName);
  }

  /**
   * Internal helper to ensure all queries exclude soft-deleted documents.
   * Adds { is_deleted: false } to the provided filter.
   */
  private withNotDeleted(
    filter: FilterQuery<TEntity> = {}
  ): FilterQuery<TEntity> {
    return { ...filter, is_deleted: false } as any;
  }

  /**
   * Create a new document in the collection.
   * @param doc - The entity data to create.
   * @returns The created document instance.
   */
  public async create(doc: Partial<TEntity>): Promise<TEntity> {
    try {
      const createdDoc = await this.model.create(doc);

      // Validate that the document was created with an _id
      if (!createdDoc || !createdDoc._id) {
        throw new Error(
          `Document created but missing _id field. Model: ${
            this.model.modelName
          }, Document: ${JSON.stringify(createdDoc)}`
        );
      }

      return createdDoc;
    } catch (error) {
      // Enhance error message with model context and original error
      if (error instanceof Error) {
        // Include the full error message with details
        throw new Error(
          `Failed to create document in ${this.model.modelName}: ${error.message}`,
          {
            cause: error,
          }
        );
      }
      throw error;
    }
  }

  /**
   * Atomically update a document using MongoDB $set operator
   * Useful for concurrent updates to different fields without overwriting the entire document
   * @param id - Document ID
   * @param updates - Object with dot-notation keys for nested updates (e.g., {'metadata.field': value})
   * @param options - Additional options
   * @returns Updated document or null if not found
   */
  public async atomicUpdate(
    id: string,
    updates: Record<string, any>,
    options: { new?: boolean; runValidators?: boolean } = {
      new: true,
      runValidators: true,
    }
  ): Promise<TEntity | null> {
    const updated = await this.model.findByIdAndUpdate(
      id,
      { $set: updates },
      options
    );
    return updated;
  }

  /**
   * Create multiple documents in the collection in a single operation.
   * @param docs - Array of entity data to create.
   * @returns Array of created document instances.
   */
  public async insertMany(
    docs: Partial<TEntity>[],
    options: { ordered: boolean } = { ordered: false }
  ): Promise<TEntity[]> {
    const createdDocs = await this.model.insertMany(docs as any[], options);
    return createdDocs as unknown as TEntity[];
  }

  /**
   * Upsert multiple documents in the collection using bulk operations.
   * If a document exists (based on the match field(s)), it will be updated.
   * If it doesn't exist, it will be inserted.
   * @param docs - Array of entity data to upsert.
   * @param matchField - The field(s) to match on for upsert operations (defaults to '_id').
   * @param options - Bulk operation options.
   * @returns Array of upserted document instances.
   */
  public async bulkWrite(
    docs: Partial<TEntity>[],
    matchField: keyof TEntity | (keyof TEntity)[] = "_id" as keyof TEntity,
    options: { ordered: boolean } = { ordered: false }
  ): Promise<BulkWriteResult<TEntity>> {
    const bulkOps = docs.map((doc) => {
      let filter: FilterQuery<TEntity>;

      if (Array.isArray(matchField)) {
        // Compound key matching
        filter = matchField.reduce((acc, field) => {
          acc[field] = doc[field];
          return acc;
        }, {} as any);
      } else {
        // Single field matching
        filter = { [matchField]: doc[matchField] } as FilterQuery<TEntity>;
      }

      if (
        "_id" in filter &&
        (filter._id === undefined || filter._id === null)
      ) {
        delete filter._id;
      }

      return {
        updateOne: {
          filter: this.withNotDeleted(filter),
          update: { $set: doc },
          upsert: true,
        },
      };
    });

    const {
      matchedCount,
      modifiedCount,
      upsertedCount,
      deletedCount,
      insertedCount,
    } = await this.model.bulkWrite(bulkOps, options);

    // Fetch and return the upserted documents
    let findFilter: FilterQuery<TEntity>;

    if (Array.isArray(matchField)) {
      // For compound keys, use $or to match any combination
      const matchFilters = docs.map((doc) =>
        matchField.reduce((acc, field) => {
          acc[field] = doc[field];
          return acc;
        }, {} as any)
      );
      findFilter = { $or: matchFilters } as FilterQuery<TEntity>;
    } else {
      // For single field, use $in
      const matchValues = docs.map((doc) => doc[matchField]);
      findFilter = {
        [matchField]: { $in: matchValues },
      } as FilterQuery<TEntity>;
    }

    const upsertedDocs = await this.model
      .find(this.withNotDeleted(findFilter))
      .exec();

    return {
      counts: {
        matchedCount,
        modifiedCount,
        upsertedCount,
        deletedCount,
        insertedCount,
      },
      entities: upsertedDocs as TEntity[],
    };
  }

  /**
   * Upsert a single document in the collection.
   * If the document has an _id and exists, it will be updated.
   * If it doesn't exist or has no _id, it will be inserted.
   * @param doc - Entity data to upsert.
   * @returns The upserted document instance.
   */
  public async upsert(doc: Partial<TEntity>): Promise<TEntity> {
    // If document has an _id, try to update existing document
    if (doc._id) {
      const result = await this.model.findOneAndUpdate(
        this.withNotDeleted({ _id: doc._id }),
        { $set: doc },
        {
          upsert: true,
          new: true, // Return the updated document
          runValidators: true, // Run schema validators
        }
      );
      return result as TEntity;
    } else {
      // No _id provided, just create a new document
      return await this.create(doc);
    }
  }

  /**
   * Find all non-deleted documents matching the filter, with optional pagination.
   * @param filter - Mongoose filter query.
   * @param options - Pagination and sorting options.
   * @returns A tuple: [array of found documents, total count].
   */
  public async find(
    filter: EntityFilter<TEntity> = {},
    options: QueryOptions = {}
  ): Promise<[TEntity[], number]> {
    const { sort, skip, limit } = options;

    let query = this.model.find(this.withNotDeleted(filter as any));
    if (sort) query = query.sort(sort);
    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);

    // Run both queries in parallel for efficiency
    const [docs, count] = await Promise.all([
      query.exec() as Promise<TEntity[]>,
      this.model.countDocuments(this.withNotDeleted(filter as any)).exec(),
    ]);

    return [docs, count];
  }

  /**
   * Find all deleted documents matching the filter, with optional pagination.
   * @param filter - Mongoose filter query.
   * @param options - Pagination and sorting options.
   * @returns A tuple: [array of found documents, total count].
   */
  public async findDeleted(
    filter: EntityFilter<TEntity> = {},
    options: QueryOptions = {}
  ): Promise<[TEntity[], number]> {
    const { sort, skip, limit } = options;

    // Explicitly filter for deleted records only
    const deletedFilter = { ...filter, is_deleted: true } as any;

    let query = this.model.find(deletedFilter);
    if (sort) query = query.sort(sort);
    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);

    // Run both queries in parallel for efficiency
    const [docs, count] = await Promise.all([
      query.exec() as Promise<TEntity[]>,
      this.model.countDocuments(deletedFilter).exec(),
    ]);

    return [docs, count];
  }

  /**
   * Find a single non-deleted document matching the filter.
   * @param filter - Mongoose filter query.
   * @returns The found document or null if not found.
   */
  public async findOne(filter: EntityFilter<TEntity>): Promise<TEntity | null> {
    const found = (await this.model
      .findOne(this.withNotDeleted(filter as any))
      .exec()) as TEntity | null;

    return found;
  }

  /**
   * Find a single non-deleted document by its MongoDB ObjectId.
   * @param id - The document's ObjectId as a string or Types.ObjectId.
   * @returns The found document or null if not found/invalid.
   */
  public async findById(id: Types.ObjectId | string): Promise<TEntity | null> {
    const found = (await this.model
      .findOne(this.withNotDeleted({ _id: id } as any))
      .exec()) as TEntity | null;

    return found;
  }

  /**
   * Find a single non-deleted document by its MongoDB ObjectId with populate support.
   * @param id - The document's ObjectId as a string or Types.ObjectId.
   * @param populateOptions - Mongoose populate options (path, select, populate nested).
   * @returns The found document with populated fields or null if not found/invalid.
   */
  public async findByIdWithPopulate(
    id: Types.ObjectId | string,
    populateOptions: any | any[]
  ): Promise<TEntity | null> {
    const found = (await this.model
      .findOne(this.withNotDeleted({ _id: id } as any))
      .populate(populateOptions)
      .exec()) as TEntity | null;

    return found;
  }

  /**
   * Find all non-deleted documents matching the filter, with population of referenced fields.
   * @param filter - Mongoose filter query.
   * @param populateOptions - Populate options (single or array) for referenced collections.
   * @param options - Optional Mongoose query options.
   * @returns Array of populated documents.
   */
  public async findWithPopulate(
    filter: EntityFilter<TEntity>,
    populateOptions: any | any[],
    options: QueryOptions = {}
  ): Promise<TEntity[]> {
    const populatedDocs = await this.model
      .find(this.withNotDeleted(filter as any), null, options as any)
      .populate(populateOptions)
      .exec();

    return populatedDocs as TEntity[];
  }

  /**
   * Update a non-deleted document by its ID.
   * @param id - The document's ObjectId as a string or Types.ObjectId.
   * @param update - The update payload (Partial entity or Mongoose UpdateQuery).
   * @returns The updated document or null if not found/invalid.
   */
  public async updateById(
    id: Types.ObjectId | string,
    update: Partial<TEntity>
  ): Promise<TEntity | null> {
    const updated = (await this.model
      .findOneAndUpdate(
        this.withNotDeleted({ _id: id } as any),
        update as any,
        {
          new: true,
          runValidators: true,
        }
      )
      .exec()) as TEntity | null;

    return updated;
  }

  /**
   * Update a non-deleted document by its ID with array filters support.
   * @param id - The document's ObjectId as a string or Types.ObjectId.
   * @param update - The update payload (Partial entity or Mongoose UpdateQuery).
   * @param arrayFilters - Optional array filters for positional updates.
   * @returns The updated document or null if not found/invalid.
   */
  public async updateByIdWithArrayFilters(
    id: Types.ObjectId | string,
    update: Partial<TEntity>,
    arrayFilters?: any[]
  ): Promise<TEntity | null> {
    const options: any = {
      new: true,
      runValidators: true,
    };

    if (arrayFilters && arrayFilters.length > 0) {
      options.arrayFilters = arrayFilters;
    }

    const updated = await this.model
      .findOneAndUpdate(
        this.withNotDeleted({ _id: id } as any),
        update as any,
        options
      )
      .exec();

    return updated as unknown as TEntity | null;
  }

  /**
   * Soft-delete a document by its ID (sets is_deleted=true).
   * @param id - The document's ObjectId as a string or Types.ObjectId.
   * @returns The soft-deleted document or null if not found/invalid.
   */
  public async softDelete(
    id: Types.ObjectId | string
  ): Promise<TEntity | null> {
    const deleted = (await this.model
      .findOneAndUpdate(
        this.withNotDeleted({ _id: id } as any),
        { is_deleted: true } as any,
        {
          new: true,
        }
      )
      .exec()) as TEntity | null;

    return deleted;
  }

  /**
   * Count the number of non-deleted documents matching the filter.
   * @param filter - Mongoose filter query.
   * @returns The count of matching documents.
   */
  public async count(filter: EntityFilter<TEntity> = {}): Promise<number> {
    return this.model.countDocuments(this.withNotDeleted(filter as any)).exec();
  }

  /**
   * Validate if a string is a valid MongoDB ObjectId.
   * @param id - The id to validate.
   * @returns True if valid, false otherwise.
   */
  public validateId(id: any): boolean {
    return Types.ObjectId.isValid(id);
  }

  /**
   * HIGH-PERFORMANCE: Clone documents to another collection using MongoDB aggregation
   * This method uses MongoDB's native aggregation pipeline for optimal performance
   *
   * @param targetCollectionName - Name of the target collection
   * @param options - Cloning configuration options
   * @returns Promise with operation results
   */
  public async cloneToCollection(
    targetCollectionName: string,
    options: CloneToCollectionOptions = {}
  ): Promise<CloneOperationResult> {
    const {
      sourceFilter = {},
      fieldMappings = {},
      staticFields = {},
      excludeFields = [],
      skipDuplicates = false,
      duplicateCheckField,
    } = options;

    const result: CloneOperationResult = {
      sourceCount: 0,
      processedCount: 0,
      insertedCount: 0,
      skippedCount: 0,
      errors: [],
    };

    try {
      // First, get count of source documents
      result.sourceCount = await this.count(sourceFilter);

      if (result.sourceCount === 0) {
        return result;
      }

      // Build aggregation pipeline
      const pipeline = this.buildClonePipeline(
        sourceFilter,
        fieldMappings,
        staticFields,
        excludeFields,
        targetCollectionName,
        skipDuplicates,
        duplicateCheckField
      );

      // Execute aggregation
      await this.model.aggregate(pipeline).exec();

      // For aggregation with $merge, we approximate the results
      result.processedCount = result.sourceCount;
      result.insertedCount = result.sourceCount;

      return result;
    } catch (error) {
      result.errors.push(
        `Clone operation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return result;
    }
  }

  /**
   * Build the aggregation pipeline for cloning
   */
  private buildClonePipeline(
    sourceFilter: FilterQuery<TEntity>,
    fieldMappings: Record<string, string>,
    staticFields: Record<string, any>,
    excludeFields: string[],
    targetCollectionName: string,
    skipDuplicates: boolean,
    duplicateCheckField?: string
  ): any[] {
    const now = new Date();

    const pipeline: any[] = [
      // Match source documents
      { $match: this.withNotDeleted(sourceFilter) },
    ];

    // Transform the data
    const transformStage: any = {
      $addFields: {
        // Add standard fields
        ...staticFields,
        created_at: now,
        updated_at: now,
        is_deleted: false,
        // Remove original _id to generate new ones
        _id: "$$REMOVE",
      },
    };

    // Apply field mappings
    for (const [targetField, sourcePath] of Object.entries(fieldMappings)) {
      const sourceExpression = this.buildFieldExpression(sourcePath);

      // Check if static field exists for this target field
      const hasStaticField = staticFields.hasOwnProperty(targetField);

      if (hasStaticField) {
        // Use conditional logic: mapped value if source has value, otherwise static value
        transformStage.$addFields[targetField] = {
          $cond: {
            if: {
              $and: [
                { $ne: [sourceExpression, null] },
                { $ne: [sourceExpression, undefined] },
                { $ne: [sourceExpression, ""] },
                { $ne: [{ $type: sourceExpression }, "missing"] },
              ],
            },
            then: sourceExpression,
            else: staticFields[targetField], // Use static field value
          },
        };
      } else {
        // No static field, use mapping as usual
        transformStage.$addFields[targetField] = sourceExpression;
      }
    }

    pipeline.push(transformStage);

    // Remove excluded fields
    if (excludeFields.length > 0) {
      pipeline.push({
        $unset: excludeFields,
      });
    }

    // Add duplicate checking if required
    if (skipDuplicates && duplicateCheckField) {
      pipeline.push({
        $lookup: {
          from: targetCollectionName,
          let: { checkValue: `$${duplicateCheckField}` },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [`$${duplicateCheckField}`, "$$checkValue"] },
                is_deleted: false,
              },
            },
          ],
          as: "existing",
        },
      });

      pipeline.push({
        $match: { existing: { $size: 0 } },
      });

      pipeline.push({
        $unset: "existing",
      });
    }

    // Merge into target collection
    pipeline.push({
      $merge: {
        into: targetCollectionName,
        whenMatched: "keepExisting",
        whenNotMatched: "insert",
      },
    });

    return pipeline;
  }

  /**
   * Build MongoDB field expression from path string
   */
  private buildFieldExpression(sourcePath: string): string {
    // Handle nested paths like 'json.company_name'
    return sourcePath.startsWith("$") ? sourcePath : `$${sourcePath}`;
  }
}
