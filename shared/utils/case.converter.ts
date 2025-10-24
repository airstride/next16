/**
 * Convert a camelCase string to snake_case
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Convert a snake_case string to camelCase
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert object keys from camelCase to snake_case
 * @param obj - The object to convert
 * @param deep - Whether to recursively convert nested objects (default: false)
 * @returns New object with snake_case keys
 */
export const objectToSnakeCase = <T = any>(
  obj: any,
  deep: boolean = false
): T => {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      deep ? objectToSnakeCase(item, deep) : item
    ) as T;
  }

  const converted: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);

    if (
      deep &&
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      converted[snakeKey] = objectToSnakeCase(value, deep);
    } else if (deep && Array.isArray(value)) {
      converted[snakeKey] = value.map((item) =>
        typeof item === "object" && item !== null
          ? objectToSnakeCase(item, deep)
          : item
      );
    } else {
      converted[snakeKey] = value;
    }
  }

  return converted as T;
};

/**
 * Convert object keys from snake_case to camelCase
 * @param obj - The object to convert
 * @param deep - Whether to recursively convert nested objects (default: false)
 * @returns New object with camelCase keys
 */
export const objectToCamelCase = <T = any>(
  obj: any,
  deep: boolean = false
): T => {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      deep ? objectToCamelCase(item, deep) : item
    ) as T;
  }

  const converted: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);

    if (
      deep &&
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      converted[camelKey] = objectToCamelCase(value, deep);
    } else if (deep && Array.isArray(value)) {
      converted[camelKey] = value.map((item) =>
        typeof item === "object" && item !== null
          ? objectToCamelCase(item, deep)
          : item
      );
    } else {
      converted[camelKey] = value;
    }
  }

  return converted as T;
};
