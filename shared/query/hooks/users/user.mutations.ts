import { useMutation } from "@tanstack/react-query";
import { post } from "@/shared/api/api.client";

// ============================================================================
// API Request Functions
// ============================================================================

/**
 * Clears org invite from user metadata.
 *
 * @param userId - The ID of the user to clear the invite from
 * @returns Promise resolving to success message
 */
export const clearOrgInviteFromMetadata = async (userId: string) => {
  if (!userId) return;
  const url = `/auth/users/${userId}/clear-org-invite`;

  const response = (await post<{ message: string }>(url, {})) as {
    message: string;
  };

  return response;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Mutation hook to clear org invite from user metadata.
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useClearOrgInviteFromMetadata();
 * mutate(userId);
 * ```
 */
export const useClearOrgInviteFromMetadata = () => {
  const mutateResult = useMutation({
    mutationFn: clearOrgInviteFromMetadata,
    onSettled(_, err) {
      if (err) {
        console.error("Error clearing org invite from metadata:", err);
        return;
      }
      // TODO: Add proper invalidateQueries and notifications
    },
  });

  return { ...mutateResult };
};
