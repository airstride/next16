/**
 * Error Utilities
 *
 * Helper functions for consistent error handling across the frontend
 */

import { notifications } from "@mantine/notifications";
import { IconX, IconAlertTriangle } from "@tabler/icons-react";

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "An unexpected error occurred";
}

/**
 * Show error notification
 */
export function showErrorNotification(error: unknown, title: string = "Error") {
  const message = getErrorMessage(error);

  notifications.show({
    title,
    message,
    color: "red",
    icon: <IconX size={18} />,
    autoClose: 5000,
  });
}

/**
 * Show warning notification
 */
export function showWarningNotification(
  message: string,
  title: string = "Warning"
) {
  notifications.show({
    title,
    message,
    color: "yellow",
    icon: <IconAlertTriangle size={18} />,
    autoClose: 4000,
  });
}

/**
 * Handle API error and show notification
 */
export function handleApiError(error: unknown, context?: string) {
  const message = getErrorMessage(error);
  const title = context ? `${context} Failed` : "Request Failed";

  showErrorNotification(message, title);
}
