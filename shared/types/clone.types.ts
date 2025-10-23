import { FilterQuery } from "mongoose";

/**
 * Options for cloning documents to another collection
 */
export interface CloneToCollectionOptions {
  /** MongoDB filter for source documents */
  sourceFilter?: FilterQuery<any>;
  /** Field mappings from source to target (targetField: sourceFieldPath) */
  fieldMappings?: Record<string, string>;
  /** Static fields to add to all cloned documents */
  staticFields?: Record<string, any>;
  /** Fields to exclude from cloning */
  excludeFields?: string[];
  /** Skip documents that already exist in target collection */
  skipDuplicates?: boolean;
  /** Field to check for duplicates (requires skipDuplicates=true) */
  duplicateCheckField?: string;
}

/**
 * Result of a clone operation
 */
export interface CloneOperationResult {
  /** Number of source documents found */
  sourceCount: number;
  /** Number of documents processed */
  processedCount: number;
  /** Number of documents inserted */
  insertedCount: number;
  /** Number of documents skipped */
  skippedCount: number;
  /** Any errors encountered */
  errors: string[];
}

