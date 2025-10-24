import { NextResponse } from "next/server";
import { withAuth, withDb, withValidation } from "@/shared/api";
import { projectsService, UpdateProjectSchema } from "@/modules/projects";
import { Permissions } from "@/shared/auth/types";
import { ErrorHandler } from "@/shared/utils/errors";
import { NextRouteContext } from "@/shared/types";

/**
 * Helper to create error responses
 */
const createErrorResponse = (error: unknown) => {
  const response = ErrorHandler.handle(error);
  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
};

/**
 * Get project by ID
 * @description Retrieve a specific project by ID
 * @response ProjectResponse
 * @auth bearer
 * @openapi
 */
export const GET = withAuth(
  withDb(
    async (
      _req,
      context: NextRouteContext<{ id: string }>,
      { activeOrgId }
    ) => {
      try {
        const { id } = await context.params;
        const project = await projectsService.getProjectContext(id);

        // Verify ownership
        if (project.organization_id !== activeOrgId) {
          return NextResponse.json(
            {
              error: "Forbidden",
              message: "You don't have access to this project",
            },
            { status: 403 }
          );
        }

        return NextResponse.json(project);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  ),
  {
    requiredPermissions: [Permissions.READ_PROJECTS],
  }
);

/**
 * Update project
 * @description Update project details
 * @body UpdateProjectSchema
 * @response ProjectResponse
 * @auth bearer
 * @openapi
 */
export const PATCH = withAuth(
  withDb(
    withValidation(
      UpdateProjectSchema,
      async (
        _req,
        context: NextRouteContext<{ id: string }>,
        { user, body, activeOrgId }
      ) => {
        try {
          const { id } = await context.params;

          // Verify ownership before update
          const existingProject = await projectsService.getProjectContext(id);
          if (existingProject.organization_id !== activeOrgId) {
            return NextResponse.json(
              {
                error: "Forbidden",
                message: "You don't have access to this project",
              },
              { status: 403 }
            );
          }

          const project = await projectsService.updateContext(
            id,
            body as any,
            user.userId
          );
          return NextResponse.json(project);
        } catch (error) {
          return createErrorResponse(error);
        }
      }
    )
  ),
  {
    requiredPermissions: [Permissions.WRITE_PROJECTS],
  }
);

/**
 * Delete project
 * @description Soft delete a project
 * @response NoContent
 * @auth bearer
 * @openapi
 */
export const DELETE = withAuth(
  withDb(
    async (
      _req,
      context: NextRouteContext<{ id: string }>,
      { activeOrgId }
    ) => {
      try {
        const { id } = await context.params;

        // Verify ownership before deletion
        const existingProject = await projectsService.getProjectContext(id);
        if (existingProject.organization_id !== activeOrgId) {
          return NextResponse.json(
            {
              error: "Forbidden",
              message: "You don't have access to this project",
            },
            { status: 403 }
          );
        }

        await projectsService.deleteById(id);
        return new NextResponse(null, { status: 204 });
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  ),
  {
    requiredPermissions: [Permissions.WRITE_PROJECTS],
  }
);
