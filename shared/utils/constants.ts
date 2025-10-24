/**
 * Default pagination constants
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_SORT = "-created_at"; // Sort by created_at descending
export const DEFAULT_PAGE = 1;

/**
 * GUID validation constants
 */
export const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const GUID_ERROR_MESSAGE = "Invalid GUID format";

/**
 * Icon size constants
 */
export const ICON_SIZE_SM = 16;
export const ICON_SIZE_MD = 20;
export const ICON_SIZE_LG = 24;
