import { URLSearchParams } from "url";
import {
  isValidObjectId,
  stringToObjectId,
} from "@/shared/utils/mongoose.utils";
import { EntityFilter, QueryOptions, SortOptions } from "@/shared/types";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  MAX_PAGE_SIZE,
} from "@/shared/utils/constants";

/**
 * Custom error class for query parsing validation errors
 */
export class QueryValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: string,
    public expectedType: string
  ) {
    super(message);
    this.name = "QueryValidationError";
  }
}

/**
 * Supported filter operators for numeric and date fields
 */
export enum FilterOperator {
  EQUALS = "eq",
  NOT_EQUALS = "neq",
  GREATER_THAN = "gt",
  GREATER_THAN_OR_EQUAL = "gte",
  LESS_THAN = "lt",
  LESS_THAN_OR_EQUAL = "lte",
  IN = "in",
  NOT_IN = "nin",
  CONTAINS = "contains",
  STARTS_WITH = "starts",
  ENDS_WITH = "ends",
}

/**
 * Configuration for searchable fields in a model
 */
export interface SearchableFields {
  /** Fields to search with regex (text search) */
  textFields: string[];
  /** Fields to search with exact match */
  exactFields?: string[];
  /** Custom search logic function */
  customSearch?: (searchTerm: string) => any;
}

/**
 * Configuration for a field that supports filtering
 */
export interface FilterableField {
  /** The field name in the database */
  field: string;
  /** Field type for type-specific parsing */
  type: "string" | "number" | "date" | "boolean" | "array" | "objectId";
  /** Allowed operators for this field */
  operators?: FilterOperator[];
  /** Whether this field supports multiple values (comma-separated) */
  allowMultiple?: boolean;
  /** Whether to validate the field value format */
  validate?: boolean;
}

/**
 * Helper type to get all keys from a schema type, excluding certain base fields
 */
type SchemaKeys<T> = Exclude<keyof T, "__v" | "_id">;

/**
 * Helper function to create a strict config with better inference
 */
export type FilterableFieldsConfig<T, TExcluded extends keyof T = never> = {
  [K in Exclude<SchemaKeys<T>, TExcluded>]: FilterableField;
};

/**
 * Strict type-safe query parser configuration that enforces ALL schema fields are accounted for
 * Either in filterableFields or explicitly excluded - gives compile-time errors for missing fields
 */
export type StrictQueryParserConfig<T, TExcluded extends keyof T = any> = {
  /** Searchable fields configuration */
  searchFields?: SearchableFields;
  /**
   * Filterable fields configuration - MUST include ALL schema fields except excluded ones
   * This enforces compile-time completeness - you'll get TypeScript errors for missing fields
   */
  filterableFields: FilterableFieldsConfig<T, TExcluded>;
  /**
   * Explicitly excluded fields from filtering
   * These fields will not be required in filterableFields
   */
  excludedFields?: TExcluded[];
  /** Default sort field and direction */
  defaultSort?: string;
  /** Default page size */
  defaultPageSize?: number;
  /** Maximum allowed page size */
  maxPageSize?: number;
};

/**
 * Parsed query result
 */
export interface ParsedQuery<TEntity = any> {
  /** MongoDB-compatible filter object */
  filters: EntityFilter<TEntity>;
  /** Sort options */
  sort: SortOptions;
  /** Pagination options */
  pagination: {
    page: number;
    page_size: number;
    skip: number;
  };
  /** Search term if provided */
  search?: string;
  /** Raw query parameters for custom processing */
  rawParams: Record<string, string>;
}

/**
 * Universal query parser for REST API filtering
 * Supports operators, multiple values, search, sorting, and pagination
 */
export class UniversalQueryParser<TEntity = any> {
  private config: StrictQueryParserConfig<TEntity>;

  constructor(config: StrictQueryParserConfig<TEntity>) {
    this.config = {
      defaultSort: DEFAULT_SORT,
      defaultPageSize: DEFAULT_PAGE_SIZE,
      maxPageSize: MAX_PAGE_SIZE,
      ...config,
    };
  }

  /**
   * Parse URL search parameters into MongoDB-compatible query
   */
  public parse(searchParams: URLSearchParams): ParsedQuery<TEntity> {
    const filters: Record<string, any> = {};
    const rawParams: Record<string, string> = {};

    // Extract all parameters
    for (const [key, value] of searchParams.entries()) {
      rawParams[key] = value;
    }

    // Validate that all parameters are supported
    this.validateSupportedParameters(searchParams);

    // Handle search
    const search = searchParams.get("search") || searchParams.get("q");
    if (search && this.config.searchFields) {
      this.applySearch(filters, search);
    }

    // Handle filtering
    this.applyFilters(filters, searchParams);

    // Handle sorting
    const sort = this.parseSort(
      searchParams.get("sort") || this.config.defaultSort!
    );

    // Handle pagination
    const pagination = this.parsePagination(searchParams);

    return {
      filters: filters as EntityFilter<TEntity>,
      sort,
      pagination,
      search: search || undefined,
      rawParams,
    };
  }

  /**
   * Validate that all search parameters are supported
   * Throws QueryValidationError for unsupported parameters
   */
  private validateSupportedParameters(searchParams: URLSearchParams): void {
    // Reserved parameters that are always allowed
    const reservedParams = new Set([
      "search",
      "q",
      "sort",
      "page",
      "page_size",
      "filters",
    ]);

    // Get all configured filterable field names
    const supportedFields = new Set(Object.keys(this.config.filterableFields));

    // Check each parameter in the search params
    for (const [paramName] of searchParams.entries()) {
      // Skip reserved parameters
      if (reservedParams.has(paramName)) {
        continue;
      }

      // Check if parameter is a supported filterable field
      if (!supportedFields.has(paramName)) {
        // Create helpful error message with available fields
        const availableFields = Array.from(supportedFields).sort().join(", ");
        throw new QueryValidationError(
          `Unsupported query parameter: '${paramName}'. Supported fields are: ${availableFields}`,
          paramName,
          searchParams.get(paramName) || "",
          "supported_field"
        );
      }
    }
  }

  /**
   * Apply search across configured searchable fields
   */
  private applySearch(filters: Record<string, any>, searchTerm: string): void {
    if (!this.config.searchFields) return;

    const { textFields, exactFields, customSearch } = this.config.searchFields;
    const searchConditions: any[] = [];

    // Text search with regex
    if (textFields?.length) {
      textFields.forEach((field) => {
        searchConditions.push({
          [field]: { $regex: searchTerm, $options: "i" },
        });
      });
    }

    // Exact match search
    if (exactFields?.length) {
      exactFields.forEach((field) => {
        searchConditions.push({
          [field]: searchTerm,
        });
      });
    }

    // Custom search logic
    if (customSearch) {
      const customCondition = customSearch(searchTerm);
      if (customCondition) {
        searchConditions.push(customCondition);
      }
    }

    if (searchConditions.length > 0) {
      filters.$or = searchConditions;
    }
  }

  /**
   * Map API field names to database field names
   * This handles MongoDB-specific field mappings like id -> _id
   */
  private mapFieldName(fieldName: string): string {
    // Handle MongoDB _id field mapping
    if (fieldName === "id") {
      return "_id";
    }
    return fieldName;
  }

  /**
   * Apply filters based on query parameters
   */

  private applyFilters(
    filters: Record<string, any>,
    searchParams: URLSearchParams
  ): void {
    // First, handle JSON-encoded filters parameter
    const filtersParam = searchParams.get("filters");
    if (filtersParam) {
      try {
        const jsonFilters = JSON.parse(filtersParam);
        this.applyJsonFilters(filters, jsonFilters);
      } catch (error) {
        console.warn("Failed to parse filters JSON parameter:", error);
      }
    }

    // Then handle direct URL parameters
    // Grab our fully‐typed config object
    const fieldConfigMap = this.config.filterableFields;
    // Tell TS these are *exactly* our keys, not just any string
    const paramNames = Object.keys(fieldConfigMap) as Array<
      keyof typeof fieldConfigMap
    >;

    for (const paramName of paramNames) {
      // Now fieldConfig is correctly inferred as FilterableField
      const fieldConfig = fieldConfigMap[paramName];
      const {
        field,
        type,
        allowMultiple,
        operators = [FilterOperator.EQUALS],
      } = fieldConfig;

      // Get ALL values for this parameter (supports multiple params with same name)
      const paramValues = searchParams.getAll(paramName as string);
      if (paramValues.length === 0) continue;

      const dbField = this.mapFieldName(field);

      for (const paramValue of paramValues) {
        const operatorExpressions = this.parseOperatorExpressions(paramValue);

        for (const expression of operatorExpressions) {
          const operatorMatch = expression.match(
            /^(eq|neq|gt|gte|lt|lte|in|nin|contains|starts|ends):(.+)$/
          );

          if (operatorMatch) {
            const [, operatorStr, value] = operatorMatch;
            const operator = operatorStr as FilterOperator;

            if (operators.includes(operator)) {
              this.applyOperatorFilter(
                filters,
                dbField,
                operator,
                value,
                type,
                allowMultiple
              );
            } else {
              // Throw error for unsupported operator
              const supportedOperators = operators.join(", ");
              throw new QueryValidationError(
                `Unsupported operator '${operator}' for field '${paramName}'. Supported operators: ${supportedOperators}`,
                paramName as string,
                paramValue,
                `operator (${supportedOperators})`
              );
            }
          } else {
            // No operator prefix → equals
            if (operators.includes(FilterOperator.EQUALS)) {
              this.applySimpleFilter(
                filters,
                dbField,
                expression,
                type,
                allowMultiple
              );
            } else {
              // Throw error if equals operator not supported
              const supportedOperators = operators.join(", ");
              throw new QueryValidationError(
                `Field '${paramName}' does not support simple equality filtering. Use explicit operators: ${supportedOperators}`,
                paramName as string,
                expression,
                `operator (${supportedOperators})`
              );
            }
          }
        }
      }
    }
  }

  /**
   * Apply JSON-encoded filters from the filters parameter
   */
  private applyJsonFilters(
    filters: Record<string, any>,
    jsonFilters: Record<string, any>
  ): void {
    const fieldConfigMap = this.config.filterableFields;

    for (const [fieldName, value] of Object.entries(jsonFilters)) {
      if (value === undefined || value === null) continue;

      // Find the field configuration
      const fieldConfig =
        fieldConfigMap[fieldName as keyof typeof fieldConfigMap];
      if (!fieldConfig) {
        // Throw error instead of just warning for JSON filters
        const availableFields = Object.keys(fieldConfigMap).sort().join(", ");
        throw new QueryValidationError(
          `Unsupported field in filters JSON: '${fieldName}'. Supported fields are: ${availableFields}`,
          fieldName,
          String(value),
          "supported_field"
        );
      }

      const {
        field,
        type,
        allowMultiple,
        operators = [FilterOperator.EQUALS],
      } = fieldConfig;
      const dbField = this.mapFieldName(field);

      // Apply simple equality filter for JSON filters
      if (operators.includes(FilterOperator.EQUALS)) {
        const parsedValue = this.parseValue(
          String(value),
          type,
          allowMultiple,
          field
        );

        if (Array.isArray(parsedValue)) {
          filters[dbField] = { $in: parsedValue };
        } else {
          filters[dbField] = parsedValue;
        }
      }
    }
  }

  /**
   * Parse operator expressions from a parameter value
   * Handles both single operators and comma-separated operators
   */
  private parseOperatorExpressions(paramValue: string): string[] {
    // Check if this looks like comma-separated operators
    if (this.hasMultipleOperators(paramValue)) {
      return paramValue.split(",").map((expr) => expr.trim());
    }

    // Single expression
    return [paramValue];
  }

  /**
   * Check if a parameter value contains multiple operator expressions
   */
  private hasMultipleOperators(value: string): boolean {
    const operatorPattern =
      /(eq|neq|gt|gte|lt|lte|in|nin|contains|starts|ends):/g;
    const matches = value.match(operatorPattern);
    return matches !== null && matches.length > 1;
  }

  /**
   * Apply operator-based filter
   */
  private applyOperatorFilter(
    filters: Record<string, any>,
    field: string,
    operator: FilterOperator,
    value: string,
    type: FilterableField["type"],
    allowMultiple?: boolean
  ): void {
    const parsedValue = this.parseValue(value, type, allowMultiple, field);

    // Initialize field object if it doesn't exist
    if (!filters[field]) {
      filters[field] = {};
    }

    // Handle the new operator condition
    let newCondition: any;

    switch (operator) {
      case FilterOperator.EQUALS:
        if (type === "boolean" && parsedValue === false) {
          // For boolean false values, also match documents where the field doesn't exist (null/undefined)
          newCondition = { $in: [false, null] };
        } else {
          newCondition = parsedValue;
        }
        break;
      case FilterOperator.NOT_EQUALS:
        newCondition = { $ne: parsedValue };
        break;
      case FilterOperator.GREATER_THAN:
        newCondition = { $gt: parsedValue };
        break;
      case FilterOperator.GREATER_THAN_OR_EQUAL:
        newCondition = { $gte: parsedValue };
        break;
      case FilterOperator.LESS_THAN:
        newCondition = { $lt: parsedValue };
        break;
      case FilterOperator.LESS_THAN_OR_EQUAL:
        newCondition = { $lte: parsedValue };
        break;
      case FilterOperator.IN:
        const inValues = Array.isArray(parsedValue)
          ? parsedValue
          : [parsedValue];
        newCondition = { $in: inValues };
        break;
      case FilterOperator.NOT_IN:
        const ninValues = Array.isArray(parsedValue)
          ? parsedValue
          : [parsedValue];
        newCondition = { $nin: ninValues };
        break;
      case FilterOperator.CONTAINS:
        newCondition = { $regex: parsedValue, $options: "i" };
        break;
      case FilterOperator.STARTS_WITH:
        newCondition = { $regex: `^${parsedValue}`, $options: "i" };
        break;
      case FilterOperator.ENDS_WITH:
        newCondition = { $regex: `${parsedValue}$`, $options: "i" };
        break;
      default:
        return;
    }

    // Merge conditions for the same field
    if (operator === FilterOperator.EQUALS) {
      // Equals overwrites existing conditions
      filters[field] = newCondition;
    } else if (typeof newCondition === "object" && newCondition !== null) {
      // Merge operator conditions
      if (
        typeof filters[field] === "object" &&
        filters[field] !== null &&
        !Array.isArray(filters[field])
      ) {
        // Merge with existing conditions
        filters[field] = { ...filters[field], ...newCondition };
      } else {
        // Replace with new condition
        filters[field] = newCondition;
      }
    }
  }

  /**
   * Apply simple equality filter
   */
  private applySimpleFilter(
    filters: Record<string, any>,
    field: string,
    value: string,
    type: FilterableField["type"],
    allowMultiple?: boolean
  ): void {
    const parsedValue = this.parseValue(value, type, allowMultiple, field);

    if (Array.isArray(parsedValue)) {
      filters[field] = { $in: parsedValue };
    } else if (type === "boolean" && parsedValue === false) {
      // For boolean false values, also match documents where the field doesn't exist (null/undefined)
      filters[field] = { $in: [false, null] };
    } else {
      filters[field] = parsedValue;
    }
  }

  /**
   * Parse value based on field type
   */
  private parseValue(
    value: string,
    type: FilterableField["type"],
    allowMultiple?: boolean,
    fieldName?: string
  ): any {
    // Handle multiple values (comma-separated)
    if (allowMultiple && value.includes(",")) {
      return value
        .split(",")
        .map((v) => this.parseSingleValue(v.trim(), type, fieldName));
    }

    return this.parseSingleValue(value, type, fieldName);
  }

  /**
   * Parse a single value based on type
   */
  private parseSingleValue(
    value: string,
    type: FilterableField["type"],
    fieldName?: string
  ): any {
    try {
      switch (type) {
        case "number":
          const num = Number(value);
          if (isNaN(num)) {
            throw new QueryValidationError(
              `Invalid number format for field '${fieldName}': '${value}'. Expected a valid number (e.g., 123, 45.67, -89)`,
              fieldName || "unknown",
              value,
              "number"
            );
          }
          return num;
        case "boolean":
          const lowerValue = value.toLowerCase();
          if (lowerValue !== "true" && lowerValue !== "false") {
            throw new QueryValidationError(
              `Invalid boolean format for field '${fieldName}': '${value}'. Expected 'true' or 'false'`,
              fieldName || "unknown",
              value,
              "boolean"
            );
          }
          return lowerValue === "true";
        case "date":
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new QueryValidationError(
              `Invalid date format for field '${fieldName}': '${value}'. Expected ISO date format (e.g., '2024-01-15', '2024-01-15T10:30:00Z')`,
              fieldName || "unknown",
              value,
              "date"
            );
          }
          return date;
        case "objectId":
          if (!isValidObjectId(value)) {
            throw new QueryValidationError(
              `Invalid ObjectId format for field '${fieldName}': '${value}'. Expected 24-character hex string (e.g., '507f1f77bcf86cd799439011')`,
              fieldName || "unknown",
              value,
              "objectId"
            );
          }
          return stringToObjectId(value);
        case "array":
        case "string":
        default:
          return value;
      }
    } catch (error) {
      // Re-throw our custom validation errors
      if (error instanceof QueryValidationError) {
        throw error;
      }
      // Wrap other errors in our custom error type
      throw new QueryValidationError(
        `Validation error for field '${fieldName}': ${
          error instanceof Error ? error.message : String(error)
        }`,
        fieldName || "unknown",
        value,
        type
      );
    }
  }

  /**
   * Parse sort parameter
   */
  private parseSort(sortParam: string): SortOptions {
    const sort: SortOptions = {};

    if (!sortParam) return sort;

    const sortFields = sortParam.split(",");

    for (const field of sortFields) {
      const trimmed = field.trim();
      if (trimmed.startsWith("-")) {
        const fieldName = trimmed.substring(1);
        const dbField = this.mapFieldName(fieldName);
        sort[dbField] = -1;
      } else if (trimmed.startsWith("+")) {
        const fieldName = trimmed.substring(1);
        const dbField = this.mapFieldName(fieldName);
        sort[dbField] = 1;
      } else {
        const dbField = this.mapFieldName(trimmed);
        sort[dbField] = 1;
      }
    }

    return sort;
  }

  /**
   * Parse pagination parameters
   */
  private parsePagination(searchParams: URLSearchParams) {
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const requestedPageSize = parseInt(
      searchParams.get("page_size") || this.config.defaultPageSize!.toString(),
      10
    );
    const page_size = Math.min(requestedPageSize, this.config.maxPageSize!);
    const skip = (page - 1) * page_size;

    return { page, page_size, skip };
  }

  /**
   * Convert parsed query to QueryOptions for BaseService
   */
  public toQueryOptions(parsedQuery: ParsedQuery<TEntity>): QueryOptions {
    return {
      sort: parsedQuery.sort,
      skip: parsedQuery.pagination.skip,
      limit: parsedQuery.pagination.page_size,
    };
  }
}

/**
 * Common filterable fields for base schema fields that can be spread into query configs
 * Corresponds to fields from baseDefinition in base.schema.ts
 */
export const baseFilterableFields = {
  created_by_propel_auth_org_id: {
    field: "created_by_propel_auth_org_id",
    type: "string" as const,
    operators: [
      FilterOperator.EQUALS,
      FilterOperator.IN,
      FilterOperator.NOT_IN,
    ],
    allowMultiple: true,
    validate: false,
  },
  created_at: {
    field: "created_at",
    type: "date" as const,
    operators: [
      FilterOperator.EQUALS,
      FilterOperator.GREATER_THAN,
      FilterOperator.GREATER_THAN_OR_EQUAL,
      FilterOperator.LESS_THAN,
      FilterOperator.LESS_THAN_OR_EQUAL,
    ],
    allowMultiple: false,
    validate: true,
  },
  updated_at: {
    field: "updated_at",
    type: "date" as const,
    operators: [
      FilterOperator.EQUALS,
      FilterOperator.GREATER_THAN,
      FilterOperator.GREATER_THAN_OR_EQUAL,
      FilterOperator.LESS_THAN,
      FilterOperator.LESS_THAN_OR_EQUAL,
    ],
    allowMultiple: false,
    validate: true,
  },
  is_deleted: {
    field: "is_deleted",
    type: "boolean" as const,
    operators: [FilterOperator.EQUALS],
    allowMultiple: false,
    validate: false,
  },
} satisfies Record<string, FilterableField>;

/**
 * Additional base fields that are often excluded but can be included when needed
 * created_by and updated_by are typically excluded in most query configs
 */
export const optionalBaseFilterableFields = {
  created_by: {
    field: "created_by",
    type: "string" as const,
    operators: [
      FilterOperator.EQUALS,
      FilterOperator.IN,
      FilterOperator.NOT_IN,
    ],
    allowMultiple: true,
    validate: false,
  },
  updated_by: {
    field: "updated_by",
    type: "string" as const,
    operators: [
      FilterOperator.EQUALS,
      FilterOperator.IN,
      FilterOperator.NOT_IN,
    ],
    allowMultiple: true,
    validate: false,
  },
} satisfies Record<string, FilterableField>;

/**
 * Convert filter object to URLSearchParams
 * Generic utility to convert POST body filters to query parameters
 */
export function convertFiltersToSearchParams(
  filters: Record<string, any>
): URLSearchParams {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    // Handle nested filters object
    if (
      key === "filters" &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      Object.entries(value).forEach(([fieldName, fieldValue]) => {
        if (fieldValue === null || fieldValue === undefined) return;

        if (typeof fieldValue === "object" && !Array.isArray(fieldValue)) {
          // Handle operator-based filtering (e.g., ids: { in: ["1", "2"] })
          Object.entries(fieldValue).forEach(([operator, operatorValue]) => {
            if (operatorValue !== undefined && operatorValue !== null) {
              // Special case: convert ids.in to id parameter with comma-separated values
              if (
                fieldName === "ids" &&
                operator === "in" &&
                Array.isArray(operatorValue)
              ) {
                searchParams.append("id", operatorValue.join(","));
              } else if (Array.isArray(operatorValue)) {
                operatorValue.forEach((v) =>
                  searchParams.append(`${fieldName}[${operator}]`, v.toString())
                );
              } else {
                searchParams.append(
                  `${fieldName}[${operator}]`,
                  operatorValue.toString()
                );
              }
            }
          });
        } else if (Array.isArray(fieldValue)) {
          fieldValue.forEach((v) =>
            searchParams.append(fieldName, v.toString())
          );
        } else {
          searchParams.append(fieldName, fieldValue.toString());
        }
      });
    } else if (typeof value === "object" && !Array.isArray(value)) {
      // Handle direct operator-based filtering (e.g., created_at: { gt: "2024-01-01" })
      Object.entries(value).forEach(([operator, operatorValue]) => {
        if (operatorValue !== undefined && operatorValue !== null) {
          if (Array.isArray(operatorValue)) {
            operatorValue.forEach((v) =>
              searchParams.append(`${key}[${operator}]`, v.toString())
            );
          } else {
            searchParams.append(
              `${key}[${operator}]`,
              operatorValue.toString()
            );
          }
        }
      });
    } else if (Array.isArray(value)) {
      // Handle array values
      value.forEach((v) => searchParams.append(key, v.toString()));
    } else {
      // Handle simple values
      searchParams.append(key, value.toString());
    }
  });

  return searchParams;
}
