/**
 * React Query Hooks for Clients API
 *
 * Provides type-safe hooks for interacting with the Clients API
 * using React Query for caching, revalidation, and state management.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post, patch, del } from "@/shared/api/api.client";
import {
  ClientResponse,
  CreateClientInput,
  UpdateClientInput,
} from "@/modules/clients";

// ============================================
// Query Keys
// ============================================

export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...clientKeys.lists(), filters] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
};

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch all clients for the current user/organization
 */
export function useClients() {
  return useQuery({
    queryKey: clientKeys.lists(),
    queryFn: async () => {
      const response = await get<ClientResponse[]>("v1/clients");
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single client by ID
 */
export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: async () => {
      const response = await get<ClientResponse>(`v1/clients/${id}`);
      return response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Create client from website URL (AI research)
 */
export function useCreateClientFromWebsite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (websiteUrl: string) => {
      const response = await post<ClientResponse>("v1/clients/research", {
        website_url: websiteUrl,
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate clients list to refetch
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

/**
 * Create client manually
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClientInput) => {
      const response = await post<ClientResponse>("v1/clients", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

/**
 * Update client
 */
export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateClientInput) => {
      const response = await patch<ClientResponse>(`v1/clients/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

/**
 * Delete client (soft delete)
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await del(`v1/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
    },
  });
}

