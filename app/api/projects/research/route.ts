import { NextResponse } from "next/server";
import { withAuth, withDb, withValidation } from "@/shared/api";
import { projectsService, WebsiteUrlInputSchema } from "@/modules/projects";
import { Permissions } from "@/shared/auth/types";
import { ErrorHandler } from "@/shared/utils/errors";

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
 * Research website and create project
 * @description Submit website URL for AI research and project creation
 * @body WebsiteUrlInputSchema
 * @response ProjectResponse
 * @auth bearer
 * @openapi
 */
export const POST = withAuth(
  withDb(
    withValidation(
      WebsiteUrlInputSchema,
      async (_req, {}, { user, body, activeOrgId }) => {
        try {
          const project = await projectsService.createProjectFromWebsite(
            body.website_url,
            user.userId,
            activeOrgId
          );
          return NextResponse.json(project, { status: 201 });
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
