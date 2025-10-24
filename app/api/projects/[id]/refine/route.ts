import { NextResponse } from "next/server";
import { withAuth, withDb, withValidation } from "@/shared/api";
import {
  projectsService,
  RefineContextInput,
  RefineContextSchema,
} from "@/modules/projects";
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
 * Refine AI-extracted context
 * @description User refines/overrides AI-extracted project data
 * @body RefineContextSchema
 * @response ProjectResponse
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDb(
    withValidation(
      RefineContextSchema,
      async (
        _req,
        context: NextRouteContext<{ id: string }>,
        { user, body, activeOrgId }
      ) => {
        try {
          const { id } = await context.params;

          // Verify ownership before refining
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

          const project = await projectsService.refineContext(
            id,
            body as RefineContextInput,
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
