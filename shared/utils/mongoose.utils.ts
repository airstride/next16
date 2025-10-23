import { Types } from "mongoose";

/**
 * Check if a string is a valid MongoDB ObjectId
 * @param id - The string to validate
 * @returns True if valid ObjectId, false otherwise
 */
export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

/**
 * Convert a string to a MongoDB ObjectId
 * @param id - The string to convert
 * @returns MongoDB ObjectId
 * @throws Error if the string is not a valid ObjectId
 */
export function stringToObjectId(id: string): Types.ObjectId {
  if (!isValidObjectId(id)) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
  return new Types.ObjectId(id);
}

/**
 * Convert a MongoDB ObjectId to a string
 * @param id - The ObjectId to convert
 * @returns String representation of the ObjectId
 */
export function objectIdToString(id: Types.ObjectId): string {
  return id.toString();
}

