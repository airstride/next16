/**
 * React Query Hooks for Projects API
 *
 * Provides type-safe hooks for interacting with the Projects API
 * using React Query for caching, revalidation, and state management.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post, patch, del } from "@/shared/api/api.client";
import {
  ProjectResponse,
  CreateProjectInput,
  UpdateProjectInput,
} from "@/modules/projects";

// ============================================
// Query Keys
// ============================================

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch all projects for the current user/organization
 */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: async () => {
      const response = await get<ProjectResponse[]>("v1/projects");
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single project by ID
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const response = await get<ProjectResponse>(`v1/projects/${id}`);
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
 * Create project from website URL (AI research)
 */
export function useCreateProjectFromWebsite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (websiteUrl: string) => {
      const response = await post<ProjectResponse>("v1/projects/research", {
        website_url: websiteUrl,
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate projects list to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Create project manually
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const response = await post<ProjectResponse>("v1/projects", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Update project
 */
export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProjectInput) => {
      const response = await patch<ProjectResponse>(`v1/projects/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Delete project (soft delete)
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await del(`v1/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
